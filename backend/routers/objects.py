from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from typing import Optional
from core.database import get_database
from services.auth import auth_service
from services.storage import storage
from models.user import User
from models.bucket import Object, Bucket

router = APIRouter()

async def get_bucket_and_check_permission(
    bucket_name: str,
    current_user: User,
    db
) -> Bucket:
    bucket_data = await db["buckets"].find_one({
        "name": bucket_name,
        "owner_id": current_user.email
    })
    if not bucket_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bucket not found or you don't have permission"
        )
    return Bucket.from_mongo(bucket_data)

@router.post("/{bucket_name}/{object_key}")
async def upload_object(
    bucket_name: str,
    object_key: str,
    file: UploadFile = File(...),
    current_user: User = Depends(auth_service.get_current_user),
    db = Depends(get_database)
):
    bucket = await get_bucket_and_check_permission(bucket_name, current_user, db)
    
    # Check user's storage quota
    if current_user.storage_used >= current_user.storage_quota:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Storage quota exceeded"
        )
    
    # Upload file and get size
    size = await storage.put_object(current_user.email, bucket_name, object_key, file)
    
    # Update user's storage usage
    await db["users"].update_one(
        {"email": current_user.email},
        {"$inc": {"storage_used": size}}
    )
    
    # Create object in bucket
    obj = Object(
        key=object_key,
        size=size,
        content_type=file.content_type
    )
    
    # Update bucket objects
    await db["buckets"].update_one(
        {"name": bucket_name},
        {"$push": {"objects": obj.to_mongo()}}
    )
    
    return obj

@router.get("/{bucket_name}/{object_key}")
async def get_object(
    bucket_name: str,
    object_key: str,
    current_user: User = Depends(auth_service.get_current_user),
    db = Depends(get_database)
):
    bucket = await get_bucket_and_check_permission(bucket_name, current_user, db)
    
    # Get object from storage
    file = await storage.get_object(current_user.email, bucket_name, object_key)
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Object not found"
        )
    
    # Find object metadata
    obj = next((obj for obj in bucket.objects if obj.key == object_key), None)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Object metadata not found"
        )
    
    return StreamingResponse(
        file,
        media_type=obj.content_type,
        headers={"Content-Disposition": f"attachment; filename={object_key}"}
    )

@router.delete("/{bucket_name}/{object_key}")
async def delete_object(
    bucket_name: str,
    object_key: str,
    current_user: User = Depends(auth_service.get_current_user),
    db = Depends(get_database)
):
    bucket = await get_bucket_and_check_permission(bucket_name, current_user, db)
    
    # Find object metadata
    obj = next((obj for obj in bucket.objects if obj.key == object_key), None)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Object not found"
        )
    
    # Delete object from storage
    await storage.delete_object(current_user.email, bucket_name, object_key)
    
    # Update user's storage usage
    await db["users"].update_one(
        {"email": current_user.email},
        {"$inc": {"storage_used": -obj.size}}
    )
    
    # Remove object from bucket
    await db["buckets"].update_one(
        {"name": bucket_name},
        {"$pull": {"objects": {"key": object_key}}}
    )
    
    return {"message": "Object deleted successfully"} 