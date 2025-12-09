from app.repositories.userrepository import UserRepository
from app.auth.passwordhasher import PasswordHasher
from app.auth.jwt import JwtHandler
from app.models.user import User

class AuthService:

    def __init__(self):
        self.repo = UserRepository()
        self.jwt_handler = JwtHandler()
        self.hasher = PasswordHasher()

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
            raise Exception("Invalid email or password")

        if not self.hasher.verify(password, user.password_hash):
            raise Exception("Invalid email or password")

        token = self.jwt_handler.encode_token({"user_id": str(user.id)})

        return {"token": token, "user": user}
