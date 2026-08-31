from fastapi import APIRouter, HTTPException, Request, status

from app.core.config import settings
from app.core.ip import extract_client_ip
from app.core.ratelimit import RateLimiter

from . import service
from .schemas import AiTextRequest

router = APIRouter(prefix="/tools/ai-text", tags=["ai-text"])

# 每 IP 每小时最多 N 次（防他人消耗你的 AI 额度）
_ai_limiter = RateLimiter(settings.ai_rate_limit, 3600)


@router.post("/process")
async def process(request: Request, req: AiTextRequest) -> dict:
    ip = extract_client_ip(request)

    if not _ai_limiter.allow(ip or "unknown"):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="请求过于频繁，请稍后再试。",
        )

    # 可选令牌层：配置了 TOOLBOX_AI_API_TOKEN 后必须携带 X-Api-Token
    if settings.ai_api_token and request.headers.get("X-Api-Token") != settings.ai_api_token:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无效的访问令牌。")

    result = await service.process_text(req.action, req.text, req.target)
    return {"action": req.action, "result": result}
