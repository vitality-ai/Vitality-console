from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

class User(BaseModel):
    email: EmailStr
    google_id: str
    full_name: str
    picture: Optional[str] = None
    storage_quota: int = 5 * 1024 * 1024 * 1024  # 5GB in bytes
    storage_used: int = 0
    api_key: Optional[str] = None
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        
    def to_mongo(self):
        """Convert the model to a MongoDB document"""
        return {
            "email": self.email,
            "google_id": self.google_id,
            "full_name": self.full_name,
            "picture": self.picture,
            "storage_quota": self.storage_quota,
            "storage_used": self.storage_used,
            "api_key": self.api_key,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

    @classmethod
    def from_mongo(cls, data: dict):
        """Create a model instance from a MongoDB document"""
        if not data:
            return None
        return cls(**data) 