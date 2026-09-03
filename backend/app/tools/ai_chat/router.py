from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import StreamingResponse

from app.core.config import settings
from app.core.ip import extract_client_ip
from app.core.ratelimit import RateLimiter

from . import service
from .schemas import ChatRequest

router = APIRouter(prefix="/tools/ai-chat", tags=["ai-chat"])

_chat_limiter = RateLimiter(settings.ai_rate_limit, 3600)


@router.post("/chat")
async def chat(request: Request, req: ChatRequest) -> StreamingResponse:
    ip = extract_client_ip(request)
    if not _chat_limiter.allow(ip or "unknown"):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="请求过于频繁，请稍后再试。")
    if settings.ai_api_token and request.headers.get("X-Api-Token") != settings.ai_api_token:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无效的访问令牌。")
    if not settings.ai_api_key:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="未配置 AI API Key（TOOLBOX_AI_API_KEY）。")

    messages = [m.model_dump() for m in req.messages]
    return StreamingResponse(
        service.stream_chat(messages),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
