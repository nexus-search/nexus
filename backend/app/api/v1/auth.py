from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.core.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.core.dependencies import get_current_active_user
from app.models.schemas import (
    MessageResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserRegisterResponse,
)
from app.models.user import User, create_user_indexes

auth_router = APIRouter(prefix="/auth", tags=["authentication"])


def init_auth_indexes():
    """Create user indexes. Call this from main app startup."""
    create_user_indexes()


@auth_router.post("/register", response_model=UserRegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister) -> UserRegisterResponse:
    """Register a new user."""
    # Check if email already exists
    if User.find_by_email(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Check if username already exists
    if User.find_by_username(user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )
    
    # Validate password (basic check)
    if len(user_data.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long",
        )
    
    # Bcrypt has a 72-byte limit
    password_bytes = user_data.password.encode('utf-8')
    if len(password_bytes) > 72:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password cannot exceed 72 bytes (approximately 72 characters for ASCII)",
        )
    
    # Create new user
    password_hash = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        username=user_data.username,
        password_hash=password_hash,
    )
    
    try:
        user_id = user.save()
        return UserRegisterResponse(
            userId=str(user_id),
            email=user.email,
            username=user.username,
        )
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already exists",
        )


@auth_router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin) -> TokenResponse:
    """Login and get access/refresh tokens."""
    user = User.find_by_email(credentials.email)
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )
    
    # Create tokens
    access_token = create_access_token(
        data={"user_id": str(user._id), "email": user.email, "role": user.role}
    )
    refresh_token = create_refresh_token(data={"user_id": str(user._id)})
    
    from app.config import get_settings
    settings = get_settings()
    
    return TokenResponse(
        accessToken=access_token,
        refreshToken=refresh_token,
        expiresIn=settings.access_token_expire_minutes * 60,
    )


@auth_router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh_token(request: RefreshTokenRequest) -> RefreshTokenResponse:
    """Refresh access token using refresh token."""
    payload = decode_token(request.refresh_token, token_type="refresh")
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
    
    user_id = payload.get("user_id")
    user = User.find_by_id(user_id)
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    
    # Create new access token
    access_token = create_access_token(
        data={"user_id": str(user._id), "email": user.email, "role": user.role}
    )
    
    from app.config import get_settings
    settings = get_settings()
    
    return RefreshTokenResponse(
        accessToken=access_token,
        expiresIn=settings.access_token_expire_minutes * 60,
    )


@auth_router.post("/logout", response_model=MessageResponse)
async def logout(current_user: User = Depends(get_current_active_user)) -> MessageResponse:
    """Logout user (client should discard tokens)."""
    # In a production system, you might want to blacklist tokens here
    # For now, we just return success - client should discard tokens
    return MessageResponse(message="Logged out successfully")

