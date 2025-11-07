from __future__ import annotations

from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.auth import decode_token
from app.models.user import User

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    """Dependency to get the current authenticated user."""
    token = credentials.credentials
    payload = decode_token(token, token_type="access")
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    
    user = User.find_by_id(user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency to get the current active user."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    return current_user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
) -> Optional[User]:
    """Optional dependency to get current user if authenticated, None otherwise."""
    if credentials is None:
        return None
    
    token = credentials.credentials
    payload = decode_token(token, token_type="access")
    
    if payload is None:
        return None
    
    user_id = payload.get("user_id")
    if user_id is None:
        return None
    
    user = User.find_by_id(user_id)
    if user is None or not user.is_active:
        return None
    
    return user

