import logging

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel, EmailStr

from config import get_settings
from models.user import User
from repositories.interfaces import UserRepository, ApiKeyRepository
from core.database import get_bucket_repo
from services.auth import (
    auth_service,
    get_user_repo_dep,
    get_api_key_repo_dep,
    hash_password,
    verify_password,
)
from services.default_bucket import ensure_default_bucket

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter()


def _access_key_log_prefix(access_key: str, max_len: int = 10) -> str:
    if not access_key:
        return "<empty>"
    if len(access_key) <= max_len:
        return access_key
    return access_key[:max_len] + "…"


class GoogleToken(BaseModel):
    token: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str = ""


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ValidateKeyRequest(BaseModel):
    access_key: str


class S3CredentialsRequest(BaseModel):
    access_key: str
    bucket: Optional[str] = None


class WarpdriveS3CredentialsResponse(BaseModel):
    """Returned to Warpdrive; ``registered_buckets`` is always present (may be ``[]``)."""

    owner_id: str
    secret_key: str
    registered_buckets: List[str]


class APIKeyResponse(BaseModel):
    access_key: str
    created_at: str
    status: str


@router.post("/google-login")
async def google_login(
    token_data: GoogleToken,
    user_repo: UserRepository = Depends(get_user_repo_dep),
):
    user_info = await auth_service.verify_google_token(token_data.token)
    email = user_info["email"]
    user_row = await user_repo.get_by_email(email)

    if not user_row:
        user = User(
            email=email,
            google_id=user_info["sub"],
            full_name=user_info.get("name", ""),
            picture=user_info.get("picture"),
            auth_provider="google",
        )
        await user_repo.create(user.to_row())
        await ensure_default_bucket(email)
    else:
        await user_repo.update(
            email,
            {
                "google_id": user_info["sub"],
                "full_name": user_info.get("name", ""),
                "picture": user_info.get("picture"),
            },
        )

    access_token = auth_service.create_access_token({"sub": email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register")
async def register(
    body: RegisterRequest,
    user_repo: UserRepository = Depends(get_user_repo_dep),
):
    existing = await user_repo.get_by_email(body.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    user = User(
        email=body.email,
        full_name=body.full_name or body.email.split("@")[0],
        password_hash=hash_password(body.password),
        auth_provider="email",
    )
    await user_repo.create(user.to_row())
    await ensure_default_bucket(body.email)
    access_token = auth_service.create_access_token({"sub": body.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login")
async def login(
    body: LoginRequest,
    user_repo: UserRepository = Depends(get_user_repo_dep),
):
    user_row = await user_repo.get_by_email(body.email)
    if not user_row or not user_row.get("password_hash"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not verify_password(body.password, user_row["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    access_token = auth_service.create_access_token({"sub": body.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me")
async def get_me(current_user: User = Depends(auth_service.get_current_user)):
    return current_user


@router.get("/api-keys")
async def get_api_keys(
    current_user: User = Depends(auth_service.get_current_user),
    api_key_repo: ApiKeyRepository = Depends(get_api_key_repo_dep),
):
    keys = await api_key_repo.list_by_owner_id(current_user.email)
    return {
        "api_keys": [
            {
                "access_key": k["access_key"],
                "created_at": k["created_at"] if isinstance(k["created_at"], str) else k["created_at"].isoformat(),
                "status": k["status"],
            }
            for k in keys
        ]
    }


@router.post("/s3-credentials", response_model=WarpdriveS3CredentialsResponse)
async def s3_credentials(
    body: S3CredentialsRequest,
    x_warpdrive_secret: str = Header(..., alias="X-Warpdrive-Secret"),
    api_key_repo: ApiKeyRepository = Depends(get_api_key_repo_dep),
):
    """
    For Warpdrive only: resolve ``access_key`` → ``owner_id`` + ``secret_key`` (SigV4).

    Response **always** includes ``registered_buckets``: all bucket names for this key's owner
    from the ``buckets`` table (``default`` is created at **registration** in Console).

    **Optional single-bucket check:** non-empty ``bucket`` → 403 unless that bucket exists for
    the key's owner.

    Requires header ``X-Warpdrive-Secret`` matching server config.
    """
    settings = get_settings()
    if not settings.warpdrive_service_secret or settings.warpdrive_service_secret != x_warpdrive_secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing service secret",
        )
    key_row = await api_key_repo.get_by_access_key(body.access_key)
    if not key_row or key_row.get("status") != "active":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or inactive key",
        )
    secret_key = key_row.get("secret_key")
    if not secret_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Key has no stored secret; generate a new key",
        )
    owner_id = key_row["owner_id"]
    ak_p = _access_key_log_prefix(body.access_key)
    bucket_name = (body.bucket or "").strip()
    bucket_repo = get_bucket_repo()

    if bucket_name:
        logger.info(
            "s3-credentials: VERIFY bucket=%r owner=%s access_key=%s (lookup in buckets table)",
            bucket_name,
            owner_id,
            ak_p,
        )
        if not await bucket_repo.get_by_owner_and_name(owner_id, bucket_name):
            logger.warning(
                "s3-credentials: DENY bucket=%r owner=%s access_key=%s — no matching row in buckets",
                bucket_name,
                owner_id,
                ak_p,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unknown or unauthorized bucket",
            )
        logger.info(
            "s3-credentials: ALLOW bucket=%r owner=%s access_key=%s — row found in `buckets` "
            "(if this surprises you, query: SELECT * FROM buckets WHERE owner_id=%r AND bucket_name=%r)",
            bucket_name,
            owner_id,
            ak_p,
            owner_id,
            bucket_name,
        )
    else:
        logger.info(
            "s3-credentials: OK (no bucket in body — bundle refresh) owner=%s access_key=%s",
            owner_id,
            ak_p,
        )
    # Always return names from the same `buckets` table as the UI (includes `default`, etc.).
    rows = await bucket_repo.list_by_owner_id(owner_id)
    registered_buckets = [r["bucket_name"] for r in rows]
    logger.info(
        "s3-credentials: registered_buckets owner=%s count=%s names=%s",
        owner_id,
        len(registered_buckets),
        registered_buckets,
    )
    return WarpdriveS3CredentialsResponse(
        owner_id=owner_id,
        secret_key=secret_key,
        registered_buckets=registered_buckets,
    )
