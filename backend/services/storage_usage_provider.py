"""
Storage usage: bucket list from Console DB + Warpdrive; object_count/total_size from Warpdrive.
"""
import asyncio
import logging
from abc import ABC, abstractmethod
from typing import List, Optional

from pydantic import BaseModel

from core.database import get_bucket_repo, get_api_key_repo
from services.warpdrive_client import get_warpdrive_url, list_buckets_with_stats_sync
from config import get_settings

logger = logging.getLogger(__name__)


class BucketSummary(BaseModel):
    name: str
    object_count: int = 0
    total_size: int = 0
    type: str = "general_purpose"
    access_policies: Optional[str] = None


class UsageSummary(BaseModel):
    storage_used: int = 0
    storage_quota: int = 0
    object_count: int = 0


class StorageUsageProvider(ABC):
    @abstractmethod
    async def list_buckets(self, owner_id: str) -> List[BucketSummary]:
        pass

    @abstractmethod
    async def get_usage(self, owner_id: str) -> UsageSummary:
        pass


def _default_quota_bytes() -> int:
    return 5 * 1024 * 1024 * 1024  # 5 GB


class ConsoleWarpdriveStorageUsageProvider(StorageUsageProvider):
    """List buckets from Console DB; enrich object_count/total_size from Warpdrive GET /s3/."""

    async def list_buckets(self, owner_id: str) -> List[BucketSummary]:
        bucket_repo = get_bucket_repo()
        console_buckets = await bucket_repo.list_by_owner_id(owner_id)
        stats_by_name: dict[str, tuple[int, int]] = {}

        warpdrive_url = get_warpdrive_url()
        if not warpdrive_url:
            logger.info("Storage usage: WARPDRIVE_URL not set, bucket stats will be 0")
        else:
            api_key_repo = get_api_key_repo()
            key_row = await api_key_repo.get_by_owner_id(owner_id)
            if not key_row:
                logger.warning(
                    "Storage usage: no API key for owner_id=%s (create one in Developer Settings), bucket stats will be 0",
                    owner_id[:16],
                )
            else:
                loop = asyncio.get_event_loop()
                warpdrive_buckets = await loop.run_in_executor(
                    None,
                    lambda: list_buckets_with_stats_sync(
                        key_row["access_key"],
                        key_row["secret_key"],
                    ),
                )
                stats_by_name = {
                    b["name"]: (b["object_count"], b["total_size"])
                    for b in warpdrive_buckets
                }

        result: List[BucketSummary] = []
        for row in console_buckets:
            name = row["bucket_name"]
            obj_count, total_size = stats_by_name.get(name, (0, 0))
            result.append(
                BucketSummary(
                    name=name,
                    object_count=obj_count,
                    total_size=total_size,
                    type=row.get("type") or "general_purpose",
                    access_policies=row.get("access_policies"),
                )
            )
        return result

    async def get_usage(self, owner_id: str) -> UsageSummary:
        buckets = await self.list_buckets(owner_id)
        storage_used = sum(b.total_size for b in buckets)
        object_count = sum(b.object_count for b in buckets)
        quota = getattr(get_settings(), "storage_quota_bytes", None) or _default_quota_bytes()
        return UsageSummary(
            storage_used=storage_used,
            storage_quota=quota,
            object_count=object_count,
        )


storage_usage_provider: StorageUsageProvider = ConsoleWarpdriveStorageUsageProvider()
