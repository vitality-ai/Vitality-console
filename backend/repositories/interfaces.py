from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Optional

# Use dict/DTO for repo layer; models can be built from these
UserRow = dict
ApiKeyRow = dict
BucketRow = dict


class UserRepository(ABC):
    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[UserRow]:
        pass

    @abstractmethod
    async def get_by_google_id(self, google_id: str) -> Optional[UserRow]:
        pass

    @abstractmethod
    async def create(self, user: UserRow) -> None:
        pass

    @abstractmethod
    async def update(self, email: str, updates: dict) -> None:
        pass


class ApiKeyRepository(ABC):
    @abstractmethod
    async def get_by_access_key(self, access_key: str) -> Optional[ApiKeyRow]:
        pass

    @abstractmethod
    async def get_by_owner_id(self, owner_id: str) -> Optional[ApiKeyRow]:
        pass

    @abstractmethod
    async def create(
        self,
        access_key: str,
        owner_id: str,
        secret_key: str,
        *,
        created_at: Optional[datetime] = None,
        status: str = "active",
    ) -> None:
        pass

    @abstractmethod
    async def delete_by_owner_id(self, owner_id: str) -> bool:
        """Returns True if a row was deleted."""
        pass

    @abstractmethod
    async def list_by_owner_id(self, owner_id: str) -> List[ApiKeyRow]:
        """Return api key rows without secret (for listing)."""
        pass


class BucketRepository(ABC):
    @abstractmethod
    async def create(self, bucket: BucketRow) -> None:
        pass

    @abstractmethod
    async def list_by_owner_id(self, owner_id: str) -> List[BucketRow]:
        pass

    @abstractmethod
    async def get_by_owner_and_name(self, owner_id: str, bucket_name: str) -> Optional[BucketRow]:
        pass
