from datetime import datetime, timedelta
import secrets
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, APIKeyHeader
from google.oauth2 import id_token
from google.auth.transport import requests
from jose import JWTError, jwt
from config import Settings
from core.database import get_database
from models.user import User

settings = Settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
api_key_header = APIKeyHeader(name="X-API-Key")

class AuthService:
    def __init__(self):
        self.settings = settings

    async def verify_google_token(self, token: str) -> dict:
        try:
            idinfo = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                self.settings.google_client_id
            )
            return idinfo
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google token"
            )

    def create_access_token(self, data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=self.settings.access_token_expire_minutes)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, self.settings.secret_key, algorithm="HS256")

    def generate_api_key(self) -> str:
        return secrets.token_urlsafe(32)

    async def get_current_user(
        self,
        token: str = Depends(oauth2_scheme),
        db = Depends(get_database)
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
                raise credentials_exception
        except JWTError:
            raise credentials_exception

        user_data = await db["users"].find_one({"email": email})
        if user_data is None:
            raise credentials_exception
        return User.from_mongo(user_data)

    async def get_user_by_api_key(
        self,
        api_key: str = Depends(api_key_header),
        db = Depends(get_database)
    ) -> Optional[User]:
        user_data = await db["users"].find_one({"api_key": api_key})
        if user_data:
            return User.from_mongo(user_data)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )

auth_service = AuthService() 