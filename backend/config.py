from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional

class Settings(BaseSettings):
    database_path: str = "./data/vitality.db"
    secret_key: str
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    access_token_expire_minutes: int = 60
    warpdrive_service_secret: Optional[str] = None
    warpdrive_url: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    return Settings()
