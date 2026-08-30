"""AI 文本处理：翻译 / 润色 / 总结 / 纠错。

调用 OpenAI 兼容的 Chat Completions 接口（默认 DeepSeek），密钥只存在服务端。
"""

from fastapi import HTTPException, status
import httpx

from app.core.config import settings

_TIMEOUT = 90.0

_PROMPTS = {
    "translate": "请把下面的文本翻译成{target}。只输出翻译结果，不要加任何解释或引号：\n\n{text}",
    "polish": "请润色下面的文本，使其更通顺、更专业、表达更精炼，保持原意不变。只输出润色后的结果：\n\n{text}",
    "summarize": "请用简洁的中文总结下面文本的要点，按条列出，每条一句话，只输出要点列表：\n\n{text}",
    "proofread": "请检查下面文本的错别字和语法错误，输出修正后的完整文本；最后用一行列出主要修改点。如果无误，直接输出原文本：\n\n{text}",
}


async def process_text(action: str, text: str, target: str) -> str:
    """调用 LLM 处理文本，返回生成结果。"""
    if not settings.ai_api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="未配置 AI API Key，请在 backend/.env 中设置 TOOLBOX_AI_API_KEY。",
        )

    prompt = _PROMPTS[action].format(target=target, text=text)
    payload = {
        "model": settings.ai_model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "stream": False,
    }
    headers = {
        "Authorization": f"Bearer {settings.ai_api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.post(
                f"{settings.ai_api_base.rstrip('/')}/chat/completions",
                json=payload,
                headers=headers,
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail="AI 服务响应超时，请重试。") from exc
    except httpx.HTTPStatusError as exc:
        detail = exc.response.text[:300] if exc.response is not None else ""
        raise HTTPException(
            status_code=502,
            detail=f"AI 服务返回错误（{exc.response.status_code if exc.response else '未知'}）：{detail}",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"无法连接 AI 服务：{exc}") from exc

    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise HTTPException(status_code=502, detail="AI 服务返回格式异常。") from exc
