import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import (
    SMTP_SERVER, SMTP_PORT, SMTP_USER, SMTP_PASSWORD,
    EMAIL_FROM, FRONTEND_BASE_URL, EMAIL_VERIFY_ENDPOINT
)

def send_verification_email(email: str, user_id: str, token: str) -> bool:
    """Send a verification email with a token link"""
    # Create verification URL (e.g., http://localhost:8000/verify-email?token=...)
    verify_url = f"{FRONTEND_BASE_URL}{EMAIL_VERIFY_ENDPOINT}?token={token}"
    
    # Email content
    subject = "Verify Your PeerPrep Account"
    body = f"""
    Hello!
    
    Please click the link below to verify your email address:
    {verify_url}
    
    This link expires in 24 hours. If you didn't create an account, you can ignore this email.
    
    Thanks,
    The PeerPrep Team
    """
    
    # Create email message
    msg = MIMEMultipart()
    msg["From"] = EMAIL_FROM
    msg["To"] = email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))
    
    try:
        # Send email via SMTP
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()  # Enable TLS encryption
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Failed to send email: {str(e)}")  # Replace with logging in production
        return False