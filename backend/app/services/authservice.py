from app.repositories.userrepository import UserRepository
from app.auth.passwordhasher import PasswordHasher
from app.auth.jwt import JwtHandler
from app.models.user import User
from app.cache.redis_client import redis_client
from app.services.emailservice import email_service
from datetime import datetime, timedelta
from fastapi import HTTPException, status

class AuthService:

    def __init__(self):
        self.repo = UserRepository()
        self.jwt_handler = JwtHandler()
        self.hasher = PasswordHasher()
        self.email_service = email_service

    async def register(self, username: str, email: str, password: str):
        # check if user exists
        existing = await self.repo.find_by_email(email)

        if existing:
            raise Exception("Email already used")
        
        
        hashed =  self.hasher.hash(password)

        user = User(
            username=username,
            email=email,
            password_hash=hashed,
        )

        await self.repo.insert(user)
        return user

    async def login(self, email: str, password: str):
        user = await self.repo.find_by_email(email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        if not self.hasher.verify(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        token = self.jwt_handler.encode_token({"user_id": str(user.id)})

        return {"token": token, "user": user}

    async def forgot_password(self, email: str):
        """Generate password reset token for user"""
        user = await self.repo.find_by_email(email)

        # Always return success to prevent email enumeration
        if not user:
            return {"message": "If the email exists, reset instructions have been sent"}

        # Generate reset token (valid for 1 hour)
        reset_token = self.jwt_handler.encode_token({
            "user_id": str(user.id),
            "type": "password_reset"
        })

        # Store token in Redis with 1 hour expiration
        await redis_client.set(
            f"reset_token:{reset_token}",
            str(user.id),
            expire=3600  # 1 hour
        )

        # Send password reset email
        await self.email_service.send_password_reset_email(
            to_email=user.email,
            reset_token=reset_token,
            username=user.username
        )

        return {
            "message": "Password reset instructions sent to your email"
        }

    async def reset_password(self, token: str, new_password: str):
        """Reset user password using reset token"""
        # Check if token exists in Redis
        user_id = await redis_client.get(f"reset_token:{token}")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired reset token"
            )

        # Get user
        user = await self.repo.find_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Hash new password
        hashed_password = self.hasher.hash(new_password)

        # Update password
        user.password_hash = hashed_password
        await user.save()

        # Delete token from Redis
        await redis_client.delete(f"reset_token:{token}")

        return {"message": "Password reset successfully"}
