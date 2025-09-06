import time
from collections import deque
from typing import Deque, Dict
from fastapi import Request, HTTPException

# in-memory store: scope+ip -> timestamps
_BUCKETS: Dict[str, Deque[float]] = {}

def limit_dep(scope: str, limit: int, window_seconds: int):
    """
    Returns a dependency that enforces `limit` requests per `window_seconds`
    per client IP for the given `scope`.
    """
    def _dep(request: Request):
        now = time.monotonic()
        ip = request.client.host if request.client else "unknown"
        key = f"{scope}:{ip}"
        dq = _BUCKETS.get(key)
        if dq is None:
            dq = deque()
            _BUCKETS[key] = dq
        # drop old timestamps
        while dq and (now - dq[0]) > window_seconds:
            dq.popleft()
        if len(dq) >= limit:
            raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")
        dq.append(now)
    return _dep
