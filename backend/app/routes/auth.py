from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.services.authservice import AuthService
from app.util.current_user import get_current_user
from app.auth.jwt import JwtHandler
from app.schemas.responses import TokenResponse, MessageResponse
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])
auth_service = AuthService()
jwt_handler = JwtHandler()


# Pydantic models for JSON requests
class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class RefreshTokenRequest(BaseModel):
    refreshToken: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    newPassword: str


@router.post("/register")
async def register(data: RegisterRequest):
    user = await auth_service.register(data.username, data.email, data.password)
    return {"id": str(user.id), "email": user.email, "username": user.username}


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    result = await auth_service.login(data.email, data.password)

    # Transform to match frontend TokenResponse type
    return TokenResponse(
        accessToken=result["token"],
        refreshToken=jwt_handler.encode_refresh_token({"user_id": str(result["user"].id)}),
        tokenType="bearer",
        expiresIn=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60  # Convert to seconds
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(data: RefreshTokenRequest):
    """
    Refresh the access token using a refresh token.
    """
    try:
        # Decode and verify refresh token
        payload = jwt_handler.decode_token(data.refreshToken)

        # Verify it's a refresh token
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=400, detail="Invalid token type")

        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="Invalid token payload")

        # Generate new tokens
        access_token = jwt_handler.encode_token({"user_id": user_id})
        refresh_token = jwt_handler.encode_refresh_token({"user_id": user_id})

        return TokenResponse(
            accessToken=access_token,
            refreshToken=refresh_token,
            tokenType="bearer",
            expiresIn=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid or expired refresh token: {str(e)}")


@router.post("/logout", response_model=MessageResponse)
async def logout(current_user=Depends(get_current_user)):
    """
    Logout the current user.
    Note: In a production system, you might want to implement token blacklisting.
    For now, the client will clear tokens on their end.
    """
    return MessageResponse(
        message="Logged out successfully",
        detail=f"User {current_user.username} logged out"
    )


# Protected route example
@router.get("/me")
async def me(current_user=Depends(get_current_user)):
    return {"id": str(current_user.id), "email": current_user.email, "username": current_user.username}


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(data: ForgotPasswordRequest):
    """
    Send password reset email to user.
    In production, this would send an email with a reset link.
    For now, we'll generate a reset token and return it (in production, only send via email).
    """
    result = await auth_service.forgot_password(data.email)
    return MessageResponse(
        message="Password reset instructions sent",
        detail=result.get("message", "Check your email for reset instructions")
    )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(data: ResetPasswordRequest):
    """
    Reset password using the reset token.
    """
    await auth_service.reset_password(data.token, data.newPassword)
    return MessageResponse(
        message="Password reset successful",
        detail="You can now login with your new password"
    )
