import aiosqlite
import os
from typing import Optional
from config import Settings
from repositories import SQLiteUserRepository, SQLiteApiKeyRepository, SQLiteBucketRepository
from repositories.interfaces import UserRepository, ApiKeyRepository, BucketRepository

_conn: Optional[aiosqlite.Connection] = None
_user_repo: Optional[UserRepository] = None
_api_key_repo: Optional[ApiKeyRepository] = None
_bucket_repo: Optional[BucketRepository] = None


async def init_sqlite() -> None:
    global _conn, _user_repo, _api_key_repo, _bucket_repo
    settings = Settings()
    path = settings.database_path
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    _conn = await aiosqlite.connect(path)
    _conn.row_factory = aiosqlite.Row
    await _run_migrations()
    _user_repo = SQLiteUserRepository(_conn)
    _api_key_repo = SQLiteApiKeyRepository(_conn)
    _bucket_repo = SQLiteBucketRepository(_conn)
    print("SQLite connected")

async def _run_migrations() -> None:
    assert _conn is not None
    await _conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            email TEXT PRIMARY KEY,
            google_id TEXT,
            full_name TEXT NOT NULL DEFAULT '',
            picture TEXT,
            password_hash TEXT,
            auth_provider TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS api_keys (
            access_key TEXT PRIMARY KEY,
            owner_id TEXT NOT NULL,
            secret_key TEXT NOT NULL,
            created_at TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            FOREIGN KEY (owner_id) REFERENCES users(email)
        );
        CREATE TABLE IF NOT EXISTS buckets (
            bucket_name TEXT NOT NULL,
            owner_id TEXT NOT NULL,
            access_policies TEXT,
            type TEXT NOT NULL DEFAULT 'general_purpose',
            created_at TEXT NOT NULL,
            UNIQUE(owner_id, bucket_name),
            FOREIGN KEY (owner_id) REFERENCES users(email)
        );
    """)
    await _conn.commit()

async def close_sqlite() -> None:
    global _conn, _user_repo, _api_key_repo, _bucket_repo
    if _conn:
        await _conn.close()
        _conn = None
    _user_repo = None
    _api_key_repo = None
    _bucket_repo = None
    print("SQLite connection closed")

def get_user_repo() -> UserRepository:
    if _user_repo is None:
        raise RuntimeError("SQLite not initialized; call init_sqlite() first")
    return _user_repo

def get_api_key_repo() -> ApiKeyRepository:
    if _api_key_repo is None:
        raise RuntimeError("SQLite not initialized; call init_sqlite() first")
    return _api_key_repo


def get_bucket_repo() -> BucketRepository:
    if _bucket_repo is None:
        raise RuntimeError("SQLite not initialized; call init_sqlite() first")
    return _bucket_repo
