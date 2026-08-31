"""请求工具：从反向代理场景中提取真实客户端 IP。"""

from fastapi import Request


def extract_client_ip(request: Request) -> str:
    """取真实客户端 IP：优先 X-Forwarded-For（Nginx 反代场景），否则直连地址。"""
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        first = forwarded.split(",")[0].strip()
        if first and first.lower() != "unknown":
            return first
    if request.client is not None:
        return request.client.host
    return ""
