import jwt
from datetime import datetime, timedelta
from app.config import settings

class JwtHandler:
    def __init__(self, secret_key: str = None, algorithm: str = None):
        self.secret_key = secret_key or settings.JWT_SECRET_KEY
        self.algorithm = algorithm or settings.JWT_ALGORITHM

        if not self.secret_key:
            raise ValueError(
                "JWT_SECRET_KEY is not configured. "
                "Please set the JWT_SECRET_KEY environment variable."
            )

    def encode_token(self, data: dict, expires_in_minutes: int = None) -> str:
        """
        Encode a JWT token with the given data.

        Args:
            data: Dictionary of claims to include in the token
            expires_in_minutes: Token expiry time in minutes (default: from settings)

        Returns:
            Encoded JWT token string
        """
        if expires_in_minutes is None:
            expires_in_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES

        payload = data.copy()
        payload["exp"] = datetime.utcnow() + timedelta(minutes=expires_in_minutes)
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

    def decode_token(self, token: str) -> dict:
        """
        Decode and verify a JWT token.

        Args:
            token: JWT token string to decode

        Returns:
            Dictionary of claims from the token

        Raises:
            jwt.ExpiredSignatureError: If token has expired
            jwt.InvalidTokenError: If token is invalid
        """
        return jwt.decode(token, self.secret_key, algorithms=[self.algorithm])

    def encode_refresh_token(self, data: dict) -> str:
        """
        Encode a refresh token with longer expiry time.

        Args:
            data: Dictionary of claims to include in the token

        Returns:
            Encoded JWT refresh token string
        """
        payload = data.copy()
        payload["exp"] = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        payload["type"] = "refresh"  # Mark as refresh token
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
