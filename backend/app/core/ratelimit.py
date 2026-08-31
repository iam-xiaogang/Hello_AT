"""进程内滑动窗口限流器（按 key，通常是客户端 IP）。

单进程部署下精确；多 worker / 多实例部署时各进程独立计数（近似限流）。
如需严格全局限流，可换成 Redis 实现。
"""

import time
from collections import defaultdict, deque


class RateLimiter:
    def __init__(self, limit: int, window_seconds: int):
        self.limit = max(1, limit)
        self.window = max(1, window_seconds)
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def allow(self, key: str) -> bool:
        """记录一次访问；未超限返回 True，超限返回 False。"""
        now = time.monotonic()
        q = self._hits[key]
        while q and now - q[0] > self.window:
            q.popleft()
        if len(q) >= self.limit:
            return False
        q.append(now)
        return True
