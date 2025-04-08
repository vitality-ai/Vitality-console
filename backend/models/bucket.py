from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class Object(BaseModel):
    key: str
    size: int
    content_type: str
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()

    def to_mongo(self):
        return {
            "key": self.key,
            "size": self.size,
            "content_type": self.content_type,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

class Bucket(BaseModel):
    name: str
    owner_id: str
    objects: List[Object] = []
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

    def to_mongo(self):
        return {
            "name": self.name,
            "owner_id": self.owner_id,
            "objects": [obj.to_mongo() for obj in self.objects],
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

    @classmethod
    def from_mongo(cls, data: dict):
        if not data:
            return None
        data["objects"] = [Object(**obj) for obj in data.get("objects", [])]
        return cls(**data) 