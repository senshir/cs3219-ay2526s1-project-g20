from fastapi import HTTPException, status
from datetime import datetime
from app.db.database import users_collection
from app.models.user import UserCreate, UserResponse, PublicUserResponse
from app.utils.security import get_password_hash, verify_password
from app.utils.verification import create_verification_token
from app.services.email_service import send_verification_email

class UserService:
    @staticmethod
    def create_user(user_data: UserCreate) -> UserResponse:
        """Create a new user"""
        # Check for existing email
        if users_collection.find_one({"email": user_data.email}):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Check for existing username
        if users_collection.find_one({"username": user_data.username}):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        # Create new user
        user = {
            "email": user_data.email,
            "username": user_data.username,
            "password": get_password_hash(user_data.password),
            "account_creation_date": datetime.now(),
            "last_login": None,
            "is_verified": False,
            "failed_login_attempts": 0,
            "is_locked": False
        }
        
        result = users_collection.insert_one(user)
        user_id = str(result.inserted_id)
        
        verification_token = create_verification_token(user_id)
        email_sent = send_verification_email(
        email=user_data.email,
        user_id=user_id,
        token=verification_token
        )
    
        if not email_sent:
        # Optional: Rollback user creation if email fails (or handle in background)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Registration successful, but failed to send verification email. Please try again later."
            )
    
        return {**user, "id": user_id}

    @staticmethod
    def get_user_by_credentials(username_or_email: str) -> dict:
        """Get user by username or email"""
        user = users_collection.find_one({
            "$or": [
                {"username": username_or_email},
                {"email": username_or_email}
            ]
        })
        return user

    @staticmethod
    def update_login_status(user_id: str) -> None:
        """Update user's last login and reset failed attempts"""
        users_collection.update_one(
            {"_id": user_id},
            {"$set": {"last_login": datetime.utcnow(), "failed_login_attempts": 0}}
        )

    @staticmethod
    def increment_failed_login(user_id: str) -> None:
        """Increment failed login attempts"""
        users_collection.update_one(
            {"_id": user_id},
            {"$inc": {"failed_login_attempts": 1}}
        )

    @staticmethod
    def get_user_by_id(user_id: str) -> dict:
        """Get user by ID"""
        return users_collection.find_one({"_id": user_id})

    @staticmethod
    def get_public_user_data(user_id: str) -> PublicUserResponse:
        """Get public user data (for other services)"""
        user = users_collection.find_one({"_id": user_id}, {"username": 1, "_id": 1})
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
        return PublicUserResponse(
            user_id=str(user["_id"]),
            username=user["username"]
        )
    