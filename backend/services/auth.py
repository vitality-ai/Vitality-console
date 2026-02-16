from datetime import datetime, timedelta
from typing import Optional, Dict
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, APIKeyHeader
from google.oauth2 import id_token
from google.auth.transport import requests
from jose import JWTError, jwt
import bcrypt
from config import Settings
from core.database import get_user_repo, get_api_key_repo
from models.user import User
from repositories.interfaces import UserRepository, ApiKeyRepository
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

settings = Settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
api_key_header = APIKeyHeader(name="X-API-Key")


def get_user_repo_dep() -> UserRepository:
    return get_user_repo()


def get_api_key_repo_dep() -> ApiKeyRepository:
    return get_api_key_repo()


# Bcrypt accepts at most 72 bytes; truncate to avoid ValueError
BCRYPT_MAX_PASSWORD_BYTES = 72


def _truncate_password_for_bcrypt(password: str) -> bytes:
    encoded = password.encode("utf-8")
    if len(encoded) <= BCRYPT_MAX_PASSWORD_BYTES:
        return encoded
    return encoded[:BCRYPT_MAX_PASSWORD_BYTES]


def hash_password(password: str) -> str:
    pw_bytes = _truncate_password_for_bcrypt(password)
    return bcrypt.hashpw(pw_bytes, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    pw_bytes = _truncate_password_for_bcrypt(plain)
    return bcrypt.checkpw(pw_bytes, hashed.encode("utf-8"))


class AuthService:
    def __init__(self):
        self.settings = settings

    def create_access_token(self, data: Dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(days=7)
        to_encode.update({
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "access_token"
        })
        encoded_jwt = jwt.encode(
            to_encode,
            self.settings.secret_key,
            algorithm="HS256"
        )
        logger.debug(f"Created access token for user: {data.get('sub')}")
        return encoded_jwt

    async def verify_google_token(self, token: str) -> dict:
        if not self.settings.google_client_id:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Google sign-in is not configured. Please use email registration or login.",
            )
        try:
            idinfo = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                self.settings.google_client_id
            )
            logger.debug(f"Verified Google token for user: {idinfo.get('email')}")
            return idinfo
        except ValueError as e:
            logger.error(f"Google token verification failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google token"
            )

    async def get_current_user(
        self,
        token: str = Depends(oauth2_scheme),
        user_repo: UserRepository = Depends(get_user_repo_dep),
    ) -> User:
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        try:
            payload = jwt.decode(token, self.settings.secret_key, algorithms=["HS256"])
            email: str = payload.get("sub")
            if email is None:
                logger.error("Token payload missing 'sub' claim")
                raise credentials_exception
        except JWTError as e:
            logger.error(f"JWT decode failed: {str(e)}")
            raise credentials_exception

        user_row = await user_repo.get_by_email(email)
        if user_row is None:
            logger.error(f"User not found: {email}")
            raise credentials_exception
        return User.from_row(user_row)

    async def get_user_by_api_key(
        self,
        api_key: str = Depends(api_key_header),
        user_repo: UserRepository = Depends(get_user_repo_dep),
        api_key_repo: ApiKeyRepository = Depends(get_api_key_repo_dep),
    ) -> Optional[User]:
        key_row = await api_key_repo.get_by_access_key(api_key)
        if not key_row:
            logger.error("Invalid API key")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key"
            )
        user_row = await user_repo.get_by_email(key_row["owner_id"])
        if not user_row:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key"
            )
        logger.debug(f"Found user by API key: {user_row['email']}")
        return User.from_row(user_row)


auth_service = AuthService()
