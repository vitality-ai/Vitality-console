from datetime import datetime, timedelta
import secrets
from typing import Optional, Dict
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, APIKeyHeader
from google.oauth2 import id_token
from google.auth.transport import requests
from jose import JWTError, jwt
from config import Settings
from core.database import get_database
from models.user import User
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

settings = Settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
api_key_header = APIKeyHeader(name="X-API-Key")

class AuthService:
    def __init__(self):
        self.settings = settings

    def create_access_token(self, data: Dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create a new JWT access token."""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(days=7)  # Default to 7 days
        
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
        """Verify Google OAuth token and return user info."""
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
        db = Depends(get_database)
    ) -> User:
        """Get current user from JWT token."""
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

        user_data = await db["users"].find_one({"email": email})
        if user_data is None:
            logger.error(f"User not found: {email}")
            raise credentials_exception
            
        logger.debug(f"Retrieved user: {email}")
        return User.from_mongo(user_data)

    async def get_user_by_api_key(
        self,
        api_key: str = Depends(api_key_header),
        db = Depends(get_database)
    ) -> Optional[User]:
        """Get user by API key."""
        user_data = await db["users"].find_one({"api_key": api_key})
        if user_data:
            logger.debug(f"Found user by API key: {user_data['email']}")
            return User.from_mongo(user_data)
            
        logger.error("Invalid API key")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )

auth_service = AuthService() 