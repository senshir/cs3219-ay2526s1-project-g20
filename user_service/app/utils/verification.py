from jose import JWTError, jwt
from datetime import datetime, timedelta, UTC
from typing import Optional, Dict
from app.config import SECRET_KEY, ALGORITHM, VERIFICATION_TOKEN_EXPIRE_HOURS

def create_verification_token(user_id: str) -> str:
    """Generate a JWT token for email verification"""
    expire = datetime.now(UTC) + timedelta(hours=VERIFICATION_TOKEN_EXPIRE_HOURS)
    to_encode = {"sub": user_id, "exp": expire, "type": "verify_email"}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_verification_token(token: str) -> Optional[str]:
    """Verify an email verification token and return user ID"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        # Validate token type and user ID
        if user_id is None or token_type != "verify_email":
            return None
        return user_id
    except JWTError:
        return None
