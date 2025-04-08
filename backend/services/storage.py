import os
import shutil
from typing import BinaryIO
from fastapi import UploadFile
from config import Settings

class StorageService:
    def __init__(self):
        settings = Settings()
        self.base_path = settings.storage_path
        os.makedirs(self.base_path, exist_ok=True)

    def _get_user_path(self, user_id: str) -> str:
        """Get the base path for a user's storage"""
        return os.path.join(self.base_path, user_id)

    def _get_object_path(self, user_id: str, bucket_name: str, object_key: str) -> str:
        """Get the full path for an object in a user's bucket"""
        user_path = self._get_user_path(user_id)
        bucket_path = os.path.join(user_path, bucket_name)
        return os.path.join(bucket_path, object_key)

    async def create_bucket(self, user_id: str, bucket_name: str):
        """Create a bucket in the user's storage space"""
        user_path = self._get_user_path(user_id)
        bucket_path = os.path.join(user_path, bucket_name)
        os.makedirs(bucket_path, exist_ok=True)

    async def delete_bucket(self, user_id: str, bucket_name: str):
        """Delete a bucket from the user's storage space"""
        user_path = self._get_user_path(user_id)
        bucket_path = os.path.join(user_path, bucket_name)
        if os.path.exists(bucket_path):
            shutil.rmtree(bucket_path)

    async def put_object(self, user_id: str, bucket_name: str, object_key: str, file: UploadFile) -> int:
        """Store an object in the user's bucket"""
        object_path = self._get_object_path(user_id, bucket_name, object_key)
        os.makedirs(os.path.dirname(object_path), exist_ok=True)
        
        size = 0
        with open(object_path, "wb") as f:
            while chunk := await file.read(8192):
                size += len(chunk)
                f.write(chunk)
        return size

    async def get_object(self, user_id: str, bucket_name: str, object_key: str) -> BinaryIO:
        """Get an object from the user's bucket"""
        object_path = self._get_object_path(user_id, bucket_name, object_key)
        if not os.path.exists(object_path):
            return None
        return open(object_path, "rb")

    async def delete_object(self, user_id: str, bucket_name: str, object_key: str):
        """Delete an object from the user's bucket"""
        object_path = self._get_object_path(user_id, bucket_name, object_key)
        if os.path.exists(object_path):
            os.remove(object_path)

storage = StorageService() 