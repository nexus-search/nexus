from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.services.authservice import AuthService
from app.util.current_user import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])
auth_service = AuthService()


# Pydantic models for JSON requests
class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/register")
async def register(data: RegisterRequest):
    user = await auth_service.register(data.username, data.email, data.password)
    return {"id": str(user.id), "email": user.email, "username": user.username}


@router.post("/login")
async def login(data: LoginRequest):
    result = await auth_service.login(data.email, data.password)
    return result


# Protected route example
@router.get("/me")
async def me(current_user=Depends(get_current_user)):
    return {"id": str(current_user.id), "email": current_user.email, "username": current_user.username}
