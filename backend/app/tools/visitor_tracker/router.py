from fastapi import APIRouter, Query, Request

from . import service

router = APIRouter(prefix="/tools/visitor-tracker", tags=["visitor-tracker"])


@router.post("/record")
async def record(request: Request) -> dict:
    """记录当前访问者（前端埋点在每次页面加载时调用一次）。"""
    ip = service.extract_client_ip(request)
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
