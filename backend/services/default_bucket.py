"""Ensure every user has a 'default' bucket (created on first use if missing)."""
from datetime import datetime

from core.database import get_bucket_repo


async def ensure_default_bucket(owner_id: str) -> None:
    """Create a bucket named 'default' for the owner if they have no buckets yet."""
    bucket_repo = get_bucket_repo()
    existing = await bucket_repo.get_by_owner_and_name(owner_id, "default")
    if not existing:
        await bucket_repo.create({
            "bucket_name": "default",
            "owner_id": owner_id,
            "access_policies": None,
            "type": "general_purpose",
            "created_at": datetime.utcnow().isoformat(),
        })
