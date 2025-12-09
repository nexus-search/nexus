from app.repositories.userrepository import UserRepository
from app.models.user import User

class UserService:
    def __init__(self):
        self.repo = UserRepository()

    async def create_user(self, username: str, email: str, password: str):
        user = User(username=username, email=email, password=password)
        return await self.repo.insert(user)

    async def get_all_users(self, page: int = 1, limit: int = 10):
        return await self.repo.find_all(page, limit)

    async def get_user_by_id(self, id: str):
        return await self.repo.find_by_id(id)

    async def update_user(self, user: User):
        return await self.repo.update(user)

    async def delete_user(self, id: str):
        return await self.repo.delete(id)
