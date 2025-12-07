from fastapi import APIRouter, Depends
from app.services.authservice import AuthService
from app.util.current_user import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])
auth_service = AuthService()

@router.post("/register")
async def register(username: str, email: str, password: str):
    user = await auth_service.register(username, email, password)
    return {"id": str(user.id), "email": user.email, "username": user.username}

@router.post("/login")
async def login(email: str, password: str):
    result = await auth_service.login(email, password)
    return result

# Example protected route
@router.get("/me")
async def me(current_user=Depends(get_current_user)):
    return {"id": str(current_user.id), "email": current_user.email, "username": current_user.username}
