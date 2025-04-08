from fastapi import APIRouter, Depends, HTTPException, status
from core.database import get_database
from services.auth import auth_service
from models.user import User
from pydantic import BaseModel

router = APIRouter()

class GoogleToken(BaseModel):
    token: str

class APIKeyResponse(BaseModel):
    api_key: str

@router.post("/google-login")
async def google_login(token_data: GoogleToken, db = Depends(get_database)):
    user_info = await auth_service.verify_google_token(token_data.token)
    
    # Check if user exists
    user_data = await db["users"].find_one({"email": user_info["email"]})
    
    if not user_data:
        # Create new user
        user = User(
            email=user_info["email"],
            google_id=user_info["sub"],
            full_name=user_info["name"],
            picture=user_info.get("picture")
        )
        await db["users"].insert_one(user.to_mongo())
    else:
        # Update existing user
        await db["users"].update_one(
            {"email": user_info["email"]},
            {"$set": {
                "google_id": user_info["sub"],
                "full_name": user_info["name"],
                "picture": user_info.get("picture"),
                "updated_at": User.from_mongo(user_data).updated_at
            }}
        )
    
    # Create access token
    access_token = auth_service.create_access_token({"sub": user_info["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/generate-api-key")
async def generate_api_key(current_user: User = Depends(auth_service.get_current_user), db = Depends(get_database)):
    api_key = auth_service.generate_api_key()
    await db["users"].update_one(
        {"email": current_user.email},
        {"$set": {"api_key": api_key}}
    )
    return APIKeyResponse(api_key=api_key)

@router.get("/me")
async def get_current_user(current_user: User = Depends(auth_service.get_current_user)):
    return current_user 