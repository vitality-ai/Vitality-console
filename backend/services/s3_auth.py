import hmac
import hashlib
import base64
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Request, HTTPException, status
from core.database import get_database
from models.user import User

class S3AuthService:
    def __init__(self):
        self.algorithm = 'AWS4-HMAC-SHA256'
        self.service = 's3'
        self.aws_region = 'auto'

    async def _get_user_by_access_key(self, access_key: str, db) -> Optional[User]:
        """Get user by their API access key"""
        api_key = await db["api_keys"].find_one({"access_key": access_key})
        if not api_key:
            return None
        
        user_data = await db["users"].find_one({"email": api_key["owner_id"]})
        if not user_data:
            return None
        
        return User.from_mongo(user_data)

    def _sign(self, key: bytes, msg: str) -> bytes:
        """Create a signature using HMAC-SHA256"""
        return hmac.new(key, msg.encode('utf-8'), hashlib.sha256).digest()

    def _get_signature_key(self, key: str, date_stamp: str, region_name: str, service_name: str) -> bytes:
        """Generate a signing key for AWS-style requests"""
        k_date = self._sign(f'AWS4{key}'.encode('utf-8'), date_stamp)
        k_region = self._sign(k_date, region_name)
        k_service = self._sign(k_region, service_name)
        k_signing = self._sign(k_service, 'aws4_request')
        return k_signing

    async def authenticate_request(self, request: Request) -> User:
        """Authenticate an S3-style request"""
        # Get access key from Authorization header or query parameters
        access_key = None
        
        # Check Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header:
            try:
                # Try to extract access key from Authorization header
                if 'AWS4-HMAC-SHA256' in auth_header:
                    # Extract from AWS v4 style
                    credential = auth_header.split('Credential=')[1].split(',')[0]
                    access_key = credential.split('/')[0]
                else:
                    # Try AWS v2 style
                    access_key = auth_header.split(':')[0]
            except:
                pass

        # If not in Authorization header, check query parameters
        if not access_key:
            access_key = request.query_params.get('AWSAccessKeyId')

        if not access_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing access key"
            )

        # Get user by access key
        db = await get_database()
        api_key = await db["api_keys"].find_one({"access_key": access_key})
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid access key"
            )

        user_data = await db["users"].find_one({"email": api_key["owner_id"]})
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        return User.from_mongo(user_data)

s3_auth_service = S3AuthService() 