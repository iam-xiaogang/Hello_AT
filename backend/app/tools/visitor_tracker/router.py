from fastapi import APIRouter, HTTPException, Query, Request, status

from app.core.ip import extract_client_ip
from app.core.ratelimit import RateLimiter
from app.core.config import settings

from . import service

router = APIRouter(prefix="/tools/visitor-tracker", tags=["visitor-tracker"])

# 每 IP 每分钟最多记录 N 次（防刷库）
_record_limiter = RateLimiter(settings.visitor_record_rate_limit, 60)


@router.post("/record")
async def record(request: Request) -> dict:
    """记录当前访问者（前端埋点在每次页面加载时调用一次）。"""
    ip = extract_client_ip(request)
    if not _record_limiter.allow(ip or "unknown"):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="访问过于频繁，请稍后再试。",
        )
    visit = service.record_visit(ip)
    return {"ok": True, "ip": ip, "visit": visit}


@router.get("/list")
async def visitor_list(limit: int = Query(200, ge=1, le=1000)) -> dict:
    """中国大陆访问者列表（按 IP 去重，时间倒序）。"""
    return {"visitors": service.list_visitors(limit)}


@router.get("/summary")
async def visitor_summary() -> dict:
    """访问量与省份分布统计。"""
    return service.summary()
