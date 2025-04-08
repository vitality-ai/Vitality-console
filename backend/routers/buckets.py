from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from core.database import get_database
from services.auth import auth_service
from services.storage import storage
from models.user import User
from models.bucket import Bucket

router = APIRouter()

@router.get("/", response_model=List[Bucket])
async def list_buckets(
    current_user: User = Depends(auth_service.get_current_user),
    db = Depends(get_database)
):
    """List all buckets owned by the current user."""
    buckets_data = await db["buckets"].find({
        "owner_id": current_user.email
    }).to_list(None)
    return [Bucket.from_mongo(bucket) for bucket in buckets_data]

@router.post("/", response_model=Bucket)
async def create_bucket(
    bucket: Bucket,
    current_user: User = Depends(auth_service.get_current_user),
    db = Depends(get_database)
):
    """Create a new bucket."""
    # Check if bucket with same name already exists for this user
    existing_bucket = await db["buckets"].find_one({
        "name": bucket.name,
        "owner_id": current_user.email
    })
    if existing_bucket:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bucket with this name already exists"
        )
    
    # Create bucket in storage with user's email as ID
    await storage.create_bucket(current_user.email, bucket.name)
    
    # Set owner and create bucket in database
    bucket.owner_id = current_user.email
    bucket_data = bucket.to_mongo()
    await db["buckets"].insert_one(bucket_data)
    
    return bucket

@router.delete("/{bucket_name}")
async def delete_bucket(
    bucket_name: str,
    current_user: User = Depends(auth_service.get_current_user),
    db = Depends(get_database)
):
    """Delete a bucket and all its contents."""
    # Check if bucket exists and user has permission
    bucket_data = await db["buckets"].find_one({
        "name": bucket_name,
        "owner_id": current_user.email
    })
    if not bucket_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bucket not found or you don't have permission"
        )
    
    bucket = Bucket.from_mongo(bucket_data)
    
    # Update user's storage usage
    total_size = sum(obj.size for obj in bucket.objects)
    if total_size > 0:
        await db["users"].update_one(
            {"email": current_user.email},
            {"$inc": {"storage_used": -total_size}}
        )
    
    # Delete bucket from storage using user's email as ID
    await storage.delete_bucket(current_user.email, bucket_name)
    
    # Delete bucket from database
    await db["buckets"].delete_one({
        "name": bucket_name,
        "owner_id": current_user.email
    })
    
    return {"message": "Bucket deleted successfully"} 