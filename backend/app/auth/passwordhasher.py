from passlib.context import CryptContext

class PasswordHasher:
    def __init__(self):
        self.context = CryptContext(schemes=["argon2"], deprecated="auto")


    def hash(self, password: str) -> str:
        return self.context.hash(password)

   
    def verify(self, password: str, hashed: str) -> bool:
        return self.context.verify(password, hashed)
