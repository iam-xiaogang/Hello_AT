"""AI 对话：SSE 流式转发 LLM 的增量输出。"""

import json

import httpx
from fastapi import HTTPException, status

from app.core.config import settings

SYSTEM_PROMPT = "你是一个简洁、有帮助的中文助手，用中文回答，回答尽量精炼。"


async def stream_chat(messages: list[dict]):
    """调用 LLM（stream=True），逐块 yield SSE 事件。"""
    if not settings.ai_api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="未配置 AI API Key（TOOLBOX_AI_API_KEY）。",
        )

    payload = {
        "model": settings.ai_model,
        "messages": [{"role": "system", "content": SYSTEM_PROMPT}] + messages,
        "stream": True,
        "temperature": 0.7,
    }
    headers = {
        "Authorization": f"Bearer {settings.ai_api_key}",
        "Content-Type": "application/json",
    }
    url = f"{settings.ai_api_base.rstrip('/')}/chat/completions"

    try:
        timeout = httpx.Timeout(connect=15.0, read=180.0, write=15.0, pool=15.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            async with client.stream("POST", url, json=payload, headers=headers) as resp:
                if resp.status_code != 200:
                    body = (await resp.aread()).decode("utf-8", "ignore")[:300]
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=f"AI 服务返回错误（{resp.status_code}）：{body}",
                    )
                async for line in resp.aiter_lines():
                    if not line.startswith("data:"):
                        continue
                    data = line[5:].strip()
                    if data == "[DONE]":
                        break
                    try:
                        obj = json.loads(data)
                        delta = (obj["choices"][0].get("delta") or {}).get("content") or ""
                    except (KeyError, IndexError, json.JSONDecodeError):
                        continue
                    if delta:
                        yield f"data: {json.dumps({'content': delta}, ensure_ascii=False)}\n\n"
    except HTTPException:
        raise
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI 服务连接失败：{exc}",
        ) from exc

    yield "data: [DONE]\n\n"
