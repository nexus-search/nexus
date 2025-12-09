from app.models.user import User

class UserRepository:
    async def insert(self,user:User):
        await user.insert()
        return user
    
    async def find_all(self, page: int = 1, limit: int = 10):
        skip = (page - 1) * limit
        return await User.find_all().skip(skip).limit(limit).to_list()

    
    async def find_by_id(self, id: str):
        return await User.get(id)
    
    async def find_by_email(self, email: str):
        return await User.find_one(User.email == email)
    
    async def update(self, user: User):
        await user.save()
        return user
    
    async def delete(self, id: str):
        user = await self.find_by_id(id)
        if user:
            await user.delete()
        return user
