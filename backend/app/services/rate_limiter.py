from collections import defaultdict, deque
from time import monotonic

from fastapi import HTTPException


class InMemoryRateLimiter:
    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str, limit: int, window_seconds: int, label: str) -> None:
        now = monotonic()
        hits = self._hits[key]
        while hits and now - hits[0] > window_seconds:
            hits.popleft()
        if len(hits) >= limit:
            raise HTTPException(
                status_code=429,
                detail=f"Too many {label} requests. Please wait a little and try again.",
            )
        hits.append(now)


rate_limiter = InMemoryRateLimiter()
