from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional

class Settings(BaseSettings):
    mongodb_url: str
    database_name: str
    secret_key: str
    google_client_id: str
    google_client_secret: str
    storage_path: str
    access_token_expire_minutes: int = 60

    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    return Settings() 