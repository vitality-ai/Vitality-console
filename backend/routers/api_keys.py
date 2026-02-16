from fastapi import APIRouter, Depends, HTTPException, status
from services.auth import auth_service, get_api_key_repo_dep
from models.user import User
from repositories.interfaces import ApiKeyRepository
import secrets
import string
from datetime import datetime

router = APIRouter()


def generate_key(length: int = 32) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


@router.post("/generate-api-key")
async def generate_api_key(
    current_user: User = Depends(auth_service.get_current_user),
    api_key_repo: ApiKeyRepository = Depends(get_api_key_repo_dep),
):
    existing = await api_key_repo.get_by_owner_id(current_user.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an API key. Delete existing key to generate a new one.",
        )
    access_key = generate_key(20)
    secret_key = generate_key(40)
    now = datetime.utcnow()
    await api_key_repo.create(
        access_key,
        current_user.email,
        secret_key=secret_key,
        created_at=now,
        status="active",
    )
    return {
        "access_key": access_key,
        "secret_key": secret_key,
        "created_at": now.isoformat(),
        "status": "active",
    }


@router.delete("/api-keys")
async def delete_api_key(
    current_user: User = Depends(auth_service.get_current_user),
    api_key_repo: ApiKeyRepository = Depends(get_api_key_repo_dep),
):
    deleted = await api_key_repo.delete_by_owner_id(current_user.email)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No API key found",
        )
    return {"message": "API key deleted successfully"}
