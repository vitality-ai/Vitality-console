import aiosqlite
from datetime import datetime
from typing import List, Optional

from .interfaces import UserRepository, ApiKeyRepository, BucketRepository, UserRow, ApiKeyRow, BucketRow


def _row_to_user(row: Optional[tuple], keys: List[str]) -> Optional[UserRow]:
    if not row:
        return None
    return dict(zip(keys, row))


def _row_to_api_key(row: Optional[tuple], keys: List[str]) -> Optional[ApiKeyRow]:
    if not row:
        return None
    return dict(zip(keys, row))


class SQLiteUserRepository(UserRepository):
    USER_KEYS = [
        "email", "google_id", "full_name", "picture", "password_hash",
        "auth_provider", "created_at", "updated_at"
    ]

    def __init__(self, conn: aiosqlite.Connection):
        self._conn = conn

    async def get_by_email(self, email: str) -> Optional[UserRow]:
        cursor = await self._conn.execute(
            "SELECT email, google_id, full_name, picture, password_hash, "
            "auth_provider, created_at, updated_at FROM users WHERE email = ?",
            (email,),
        )
        row = await cursor.fetchone()
        await cursor.close()
        return _row_to_user(row, self.USER_KEYS)

    async def get_by_google_id(self, google_id: str) -> Optional[UserRow]:
        cursor = await self._conn.execute(
            "SELECT email, google_id, full_name, picture, password_hash, "
            "auth_provider, created_at, updated_at FROM users WHERE google_id = ?",
            (google_id,),
        )
        row = await cursor.fetchone()
        await cursor.close()
        return _row_to_user(row, self.USER_KEYS)

    async def create(self, user: UserRow) -> None:
        now = datetime.utcnow()
        created = user.get("created_at", now)
        updated = user.get("updated_at", now)
        if isinstance(created, datetime):
            created = created.isoformat()
        if isinstance(updated, datetime):
            updated = updated.isoformat()
        await self._conn.execute(
            "INSERT INTO users (email, google_id, full_name, picture, password_hash, "
            "auth_provider, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (
                user.get("email"),
                user.get("google_id"),
                user.get("full_name", ""),
                user.get("picture"),
                user.get("password_hash"),
                user.get("auth_provider"),
                created,
                updated,
            ),
        )
        await self._conn.commit()

    async def update(self, email: str, updates: dict) -> None:
        allowed = {"google_id", "full_name", "picture", "password_hash", "auth_provider", "updated_at"}
        updates = dict(updates)
        updates["updated_at"] = datetime.utcnow()
        set_parts = []
        values = []
        for k, v in updates.items():
            if k in allowed:
                set_parts.append(f"{k} = ?")
                if isinstance(v, datetime):
                    v = v.isoformat()
                values.append(v)
        if not set_parts:
            return
        values.append(email)
        await self._conn.execute(
            f"UPDATE users SET {', '.join(set_parts)} WHERE email = ?",
            tuple(values),
        )
        await self._conn.commit()


class SQLiteApiKeyRepository(ApiKeyRepository):
    API_KEY_KEYS = ["access_key", "owner_id", "secret_key", "created_at", "status"]

    def __init__(self, conn: aiosqlite.Connection):
        self._conn = conn

    async def get_by_access_key(self, access_key: str) -> Optional[ApiKeyRow]:
        cursor = await self._conn.execute(
            "SELECT access_key, owner_id, secret_key, created_at, status "
            "FROM api_keys WHERE access_key = ?",
            (access_key,),
        )
        row = await cursor.fetchone()
        await cursor.close()
        return _row_to_api_key(row, self.API_KEY_KEYS)

    async def get_by_owner_id(self, owner_id: str) -> Optional[ApiKeyRow]:
        cursor = await self._conn.execute(
            "SELECT access_key, owner_id, secret_key, created_at, status "
            "FROM api_keys WHERE owner_id = ?",
            (owner_id,),
        )
        row = await cursor.fetchone()
        await cursor.close()
        return _row_to_api_key(row, self.API_KEY_KEYS)

    async def create(
        self,
        access_key: str,
        owner_id: str,
        secret_key: str,
        *,
        created_at: Optional[datetime] = None,
        status: str = "active",
    ) -> None:
        now = created_at or datetime.utcnow()
        if isinstance(now, datetime):
            now = now.isoformat()
        await self._conn.execute(
            "INSERT INTO api_keys (access_key, owner_id, secret_key, created_at, status) "
            "VALUES (?, ?, ?, ?, ?)",
            (access_key, owner_id, secret_key, now, status),
        )
        await self._conn.commit()

    async def delete_by_owner_id(self, owner_id: str) -> bool:
        cursor = await self._conn.execute(
            "DELETE FROM api_keys WHERE owner_id = ?", (owner_id,)
        )
        await self._conn.commit()
        return cursor.rowcount > 0

    async def list_by_owner_id(self, owner_id: str) -> List[ApiKeyRow]:
        cursor = await self._conn.execute(
            "SELECT access_key, owner_id, secret_key, created_at, status "
            "FROM api_keys WHERE owner_id = ?",
            (owner_id,),
        )
        rows = await cursor.fetchall()
        await cursor.close()
        keys = self.API_KEY_KEYS
        result = []
        for row in rows:
            d = dict(zip(keys, row))
            d.pop("secret_key", None)  # Do not expose secret in list
            result.append(d)
        return result


class SQLiteBucketRepository(BucketRepository):
    BUCKET_KEYS = ["bucket_name", "owner_id", "access_policies", "type", "created_at"]

    def __init__(self, conn: aiosqlite.Connection):
        self._conn = conn

    async def create(self, bucket: BucketRow) -> None:
        now = datetime.utcnow()
        created = bucket.get("created_at", now)
        if isinstance(created, datetime):
            created = created.isoformat()
        await self._conn.execute(
            "INSERT INTO buckets (bucket_name, owner_id, access_policies, type, created_at) "
            "VALUES (?, ?, ?, ?, ?)",
            (
                bucket["bucket_name"],
                bucket["owner_id"],
                bucket.get("access_policies"),
                bucket.get("type", "general_purpose"),
                created,
            ),
        )
        await self._conn.commit()

    async def list_by_owner_id(self, owner_id: str) -> List[BucketRow]:
        cursor = await self._conn.execute(
            "SELECT bucket_name, owner_id, access_policies, type, created_at FROM buckets WHERE owner_id = ?",
            (owner_id,),
        )
        rows = await cursor.fetchall()
        await cursor.close()
        keys = self.BUCKET_KEYS
        return [dict(zip(keys, row)) for row in rows]

    async def get_by_owner_and_name(self, owner_id: str, bucket_name: str) -> Optional[BucketRow]:
        cursor = await self._conn.execute(
            "SELECT bucket_name, owner_id, access_policies, type, created_at FROM buckets "
            "WHERE owner_id = ? AND bucket_name = ?",
            (owner_id, bucket_name),
        )
        row = await cursor.fetchone()
        await cursor.close()
        if not row:
            return None
        return dict(zip(self.BUCKET_KEYS, row))
