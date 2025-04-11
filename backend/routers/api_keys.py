from fastapi import APIRouter, Depends, HTTPException, status
from core.database import get_database
from services.auth import auth_service
from models.user import User
import secrets
import string
from datetime import datetime

router = APIRouter()

def generate_key(length: int = 32) -> str:
    """Generate a random API key."""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

@router.post("/generate-api-key")
async def generate_api_key(
    current_user: User = Depends(auth_service.get_current_user),
    db = Depends(get_database)
):
    """Generate a new API key pair for the user."""
    # Check if user already has an API key
    existing_key = await db["api_keys"].find_one({
        "owner_id": current_user.email
    })
    
    if existing_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an API key. Delete existing key to generate a new one."
        )
    
    # Generate new API key pair
    access_key = generate_key(20)
    secret_key = generate_key(40)
    
    # Create API key document
    api_key_data = {
        "access_key": access_key,
        "owner_id": current_user.email,
        "created_at": datetime.utcnow(),
        "status": "active"
    }
    
    # Store in database (without secret key)
    await db["api_keys"].insert_one(api_key_data)
    print("API key generated")
    print(access_key, secret_key)
    # Return both keys (secret key only shown once)
    return {
        "access_key": access_key,
        "secret_key": secret_key,
        "created_at": api_key_data["created_at"].isoformat(),
        "status": "active"
    }

@router.delete("/api-keys")
async def delete_api_key(
    current_user: User = Depends(auth_service.get_current_user),
    db = Depends(get_database)
):
    """Delete the user's API key."""
    result = await db["api_keys"].delete_one({
        "owner_id": current_user.email
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No API key found"
        )
    
    return {"message": "API key deleted successfully"}

