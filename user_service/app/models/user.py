from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from typing import Optional
import re
from app.config import PASSWORD_MIN_LENGTH

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

    @field_validator('password')
    def validate_password(cls, v):
        if len(v) < PASSWORD_MIN_LENGTH:
            raise ValueError(f'Password must be at least {PASSWORD_MIN_LENGTH} characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    username: str
    account_creation_date: datetime
    last_login: Optional[datetime] = None

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class PublicUserResponse(BaseModel):
    user_id: str
    username: str
    