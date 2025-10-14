import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# MongoDB settings
MONGO_URI = os.getenv("MONGO_URI")
DATABASE_NAME = os.getenv("DB_NAME")
USERS_COLLECTION = "users"

# Security settings
SECRET_KEY = os.getenv("SECRET_KEY", "default-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Password complexity settings
PASSWORD_MIN_LENGTH = 8

# New: Email verification settings
VERIFICATION_TOKEN_EXPIRE_HOURS = 24  # Token expires in 24 hours
EMAIL_VERIFY_ENDPOINT = "/verify-email"  # Endpoint for verification
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:8000")  # Your app's URL

# SMTP settings (use environment variables in production)
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")  # e.g., smtp.gmail.com for Gmail
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))  # Typically 587 for TLS
SMTP_USER = os.getenv("SMTP_USER", "your-email@gmail.com")  # Your email
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "your-app-password")  # App-specific password (not your main password)
EMAIL_FROM = os.getenv("EMAIL_FROM", "PeerPrep <noreply@peerprep.com>")
