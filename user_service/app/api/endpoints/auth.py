from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.models.user import UserCreate, UserResponse
from app.models.token import Token
from app.services.user_service import UserService
from app.services.auth_service import AuthService

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
    