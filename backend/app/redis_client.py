import json
from typing import Optional, Any
from redis.asyncio import Redis
from .config import settings


class RedisClient:
    def __init__(self):
        self.redis: Optional[Redis] = None

    async def init(self):
        self.redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)

    async def close(self):
        if self.redis:
            await self.redis.aclose()

    async def get(self, key: str) -> Optional[Any]:
        if not self.redis:
            return None
        data = await self.redis.get(key)
        if data:
            return json.loads(data)
        return None

    async def set(self, key: str, value: Any, expire: int = 300) -> None:
        if not self.redis:
            return
        await self.redis.setex(key, expire, json.dumps(value))

    async def delete(self, key: str) -> None:
        if not self.redis:
            return
        await self.redis.delete(key)

    async def delete_pattern(self, pattern: str) -> None:
        if not self.redis:
            return
        keys = await self.redis.keys(pattern)
        if keys:
            await self.redis.delete(*keys)


redis_client = RedisClient()
