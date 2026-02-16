"""Bucket and usage endpoints. Bucket metadata from Console DB; stats from Warpdrive."""
import re
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from services.auth import auth_service
from services.default_bucket import ensure_default_bucket
from services.storage_usage_provider import (
    storage_usage_provider,
    BucketSummary,
    UsageSummary,
)
from models.user import User
from core.database import get_bucket_repo

router = APIRouter()

# S3 bucket name rules: 3-63 chars, lowercase/numbers/hyphens, no double hyphen
BUCKET_NAME_PATTERN = re.compile(r"^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$")
BUCKET_TYPES = ("general_purpose", "ai_training")


def _validate_bucket_name(name: str) -> None:
    if not name or len(name) < 3 or len(name) > 63:
        raise HTTPException(400, "Bucket name must be 3-63 characters")
    if ".." in name or name.startswith(".") or name.endswith("."):
        raise HTTPException(400, "Bucket name cannot contain consecutive dots or start/end with a dot")
    if "--" in name or name.startswith("-") or name.endswith("-"):
        raise HTTPException(400, "Bucket name cannot contain consecutive hyphens or start/end with a hyphen")
    if not BUCKET_NAME_PATTERN.match(name):
        raise HTTPException(400, "Bucket name must be lowercase letters, numbers, hyphens, or dots only")


class CreateBucketRequest(BaseModel):
    name: str = Field(..., min_length=1)
    type: str = Field(default="general_purpose", description="general_purpose or ai_training")
    access_policies: Optional[str] = None


class BucketCreated(BaseModel):
    name: str
    type: str
    access_policies: Optional[str]
    created_at: str


@router.get("/", response_model=list[BucketSummary])
async def list_buckets(
    current_user: User = Depends(auth_service.get_current_user),
):
    """List buckets for the current user (from Console DB, enriched with Warpdrive stats)."""
    await ensure_default_bucket(current_user.email)
    return await storage_usage_provider.list_buckets(current_user.email)


@router.post("/", response_model=BucketCreated, status_code=201)
async def create_bucket(
    body: CreateBucketRequest,
    current_user: User = Depends(auth_service.get_current_user),
):
    """Create a bucket (metadata in Console only)."""
    _validate_bucket_name(body.name)
    if body.type not in BUCKET_TYPES:
        raise HTTPException(400, f"type must be one of: {', '.join(BUCKET_TYPES)}")
    repo = get_bucket_repo()
    existing = await repo.get_by_owner_and_name(current_user.email, body.name)
    if existing:
        raise HTTPException(409, "A bucket with this name already exists")
    now = datetime.utcnow().isoformat()
    await repo.create({
        "bucket_name": body.name,
        "owner_id": current_user.email,
        "access_policies": body.access_policies,
        "type": body.type,
        "created_at": now,
    })
    return BucketCreated(name=body.name, type=body.type, access_policies=body.access_policies, created_at=now)


@router.get("/usage", response_model=UsageSummary)
async def get_usage(
    current_user: User = Depends(auth_service.get_current_user),
):
    """Get storage usage for the current user (read-only; data from Warpdrive)."""
    return await storage_usage_provider.get_usage(current_user.email)
