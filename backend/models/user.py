from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr

class User(BaseModel):
    email: EmailStr
    google_id: Optional[str] = None
    full_name: str = ""
    picture: Optional[str] = None
    password_hash: Optional[str] = None
    auth_provider: Optional[Literal["google", "email"]] = None
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

    def to_row(self) -> dict:
        return self.model_dump()

    @classmethod
    def from_row(cls, data: Optional[dict]):
        if not data:
            return None
        return cls(**data)
