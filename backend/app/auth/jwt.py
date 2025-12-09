import jwt
from datetime import datetime, timedelta

class JwtHandler:
    def __init__(self, secret_key: str = "alikeyforexampleithinkitshouldbeprettylongtoworkperhapslongenoughcharachtersjesaisdestasdechosesbahouais", algorithm: str = "HS256"):
        self.secret_key = secret_key
        self.algorithm = algorithm

    def encode_token(self, data: dict, expires_in_minutes=15) -> str:
        payload = data.copy()
        payload["exp"] = datetime.utcnow() + timedelta(minutes=expires_in_minutes)
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

    def decode_token(self, token: str) -> dict:
        return jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
