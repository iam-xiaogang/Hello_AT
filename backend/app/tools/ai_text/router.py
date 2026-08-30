from fastapi import APIRouter

from . import service
from .schemas import AiTextRequest

router = APIRouter(prefix="/tools/ai-text", tags=["ai-text"])


@router.post("/process")
async def process(req: AiTextRequest) -> dict:
    result = await service.process_text(req.action, req.text, req.target)
    return {"action": req.action, "result": result}
