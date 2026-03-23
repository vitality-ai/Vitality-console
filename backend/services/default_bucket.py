"""
Create the `default` bucket for a new account.

Only called from **registration** flows in ``routers/auth`` (email register and first-time
Google login). Other endpoints read the ``buckets`` table as-is.
"""
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
