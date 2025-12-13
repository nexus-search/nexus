import redis.asyncio as aioredis
from app.config import settings
from typing import Optional
import json

class RedisClient:
    """Async Redis client for caching and temporary data storage"""

    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None

    async def connect(self):
        """Connect to Redis"""
        try:
            self.redis = await aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
            # Test connection
            await self.redis.ping()
            print("✅ Connected to Redis")
        except Exception as e:
            print(f"⚠️  Redis connection failed: {e}")
            print("   Password reset tokens will use in-memory storage (not production-safe)")
            self.redis = None

    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis:
            await self.redis.close()

    async def set(self, key: str, value: str, expire: int = None):
        """Set a key-value pair with optional expiration in seconds"""
        if not self.redis:
            return False
        try:
            if expire:
                await self.redis.setex(key, expire, value)
            else:
                await self.redis.set(key, value)
            return True
        except Exception as e:
            print(f"Redis set error: {e}")
            return False

    async def get(self, key: str) -> Optional[str]:
        """Get value by key"""
        if not self.redis:
            return None
        try:
            return await self.redis.get(key)
        except Exception as e:
            print(f"Redis get error: {e}")
            return None

    async def delete(self, key: str):
        """Delete a key"""
        if not self.redis:
            return False
        try:
            await self.redis.delete(key)
            return True
        except Exception as e:
            print(f"Redis delete error: {e}")
            return False

    async def exists(self, key: str) -> bool:
        """Check if key exists"""
        if not self.redis:
            return False
        try:
            return await self.redis.exists(key) > 0
        except Exception as e:
            print(f"Redis exists error: {e}")
            return False

# Global instance
redis_client = RedisClient()
