from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from app.models.user import UserCreate, UserResponse
from app.models.token import Token
from app.services.user_service import UserService
from app.services.auth_service import AuthService
from app.db.database import get_users_collection
from app.utils.verification import verify_verification_token

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate):
    """Register a new user"""
    return UserService.create_user(user)

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Authenticate a user and return an access token"""
    user = AuthService.authenticate_user(form_data.username, form_data.password)
    
    # Update login status
    UserService.update_login_status(user["_id"])
    
    # Create access token
    access_token = AuthService.create_user_token(user["_id"])
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/verify-email", status_code=status.HTTP_200_OK)
async def verify_email(token: str = Query(..., description="Verification token from email")):
    """Verify a user's email address using the token sent via email"""
    # Verify the token
    user_id = verify_verification_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    # Update user's verification status
    users_collection = get_users_collection()
    result = users_collection.update_one(
        {"_id": user_id},
        {"$set": {"is_verified": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or already verified"
        )
    
    return {"message": "Email successfully verified! You can now log in."}
