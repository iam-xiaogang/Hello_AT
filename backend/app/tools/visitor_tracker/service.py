"""访问者统计核心逻辑。

两种数据源：
1. 远程模式（默认，配置了 TOOLBOX_VISITOR_API_BASE 时）：代理到 h3blog 的
   /api/visitor/* 接口，跨项目共享访问数据（IP 定位与存储都在 h3blog 侧）。
2. 本地兜底（未配置远程地址时）：ip2region 离线定位 + SQLite 访问历史。
"""

import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from zoneinfo import ZoneInfo

import httpx
from fastapi import HTTPException, Request, status

import ip2region.util as ip2r_util
from ip2region.searcher import new_with_buffer

from app.core.config import settings
from app.db import get_connection

XDB_PATH = Path(__file__).resolve().parent / "data" / "ip2region_v4.xdb"
CN_TZ = ZoneInfo("Asia/Shanghai")

_REMOTE_TIMEOUT = 8.0

SCHEMA = """
CREATE TABLE IF NOT EXISTS visitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT '',
    province TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    isp TEXT NOT NULL DEFAULT '',
    country_code TEXT NOT NULL DEFAULT '',
    visited_at TEXT NOT NULL
);
"""

_searcher: object | None = None


def _get_searcher():
    """Lazily build the xdb searcher (whole database cached in memory)."""
    global _searcher
    if _searcher is None:
        if not XDB_PATH.exists():
            raise RuntimeError(f"缺少 IP 数据库文件: {XDB_PATH}")
        header = ip2r_util.load_header_from_file(str(XDB_PATH))
        version = ip2r_util.version_from_header(header)
        content = ip2r_util.load_content_from_file(str(XDB_PATH))
        _searcher = new_with_buffer(version, content)
    return _searcher


def locate(ip: str) -> dict[str, str]:
    """离线定位一个 IPv4 地址，返回国家/省份/城市/ISP/国家代码。"""
    try:
        raw = _get_searcher().search(ip)
    except ValueError:
        raw = ""
    parts = (raw.split("|") + ["", "", "", "", ""])[:5]
    country, province, city, isp, code = parts
    return {
        "country": country,
        "province": "" if province == "0" else province,
        "city": "" if city == "0" else city,
        "isp": "" if isp == "0" else isp,
        "country_code": code,
    }


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


# ---------------------------------------------------------------------------
# 远程模式：代理到 h3blog 的 /api/visitor/*
# ---------------------------------------------------------------------------

def _remote_enabled() -> bool:
    return bool(settings.visitor_api_base)


def _remote_url(path: str) -> str:
    return settings.visitor_api_base.rstrip("/") + path


def _remote_record(ip: str) -> Optional[dict[str, str]]:
    """把访问转发给 h3blog 记录；转发真实客户端 IP 供其定位。"""
    if not ip:
        return None
    try:
        resp = httpx.post(
            _remote_url("/api/visitor/record"),
            headers={"X-Forwarded-For": ip},
            timeout=_REMOTE_TIMEOUT,
        )
        resp.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"访问统计服务暂不可用: {exc}",
        ) from exc
    return resp.json().get("visit")


def _remote_get(path: str, params: dict[str, object]) -> dict:
    try:
        resp = httpx.get(
            _remote_url(path),
            params=params,
            headers={"X-Api-Token": settings.visitor_api_token},
            timeout=_REMOTE_TIMEOUT,
        )
        resp.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"访问统计服务暂不可用: {exc}",
        ) from exc
    return resp.json()


def _ensure_table(conn: sqlite3.Connection) -> None:
    conn.execute(SCHEMA)
    conn.commit()


def record_visit(ip: str) -> Optional[dict[str, str]]:
    """记录一次访问，返回该记录（IP 无效时返回 None）。"""
    if _remote_enabled():
        return _remote_record(ip)
    if not ip:
        return None
    geo = locate(ip)
    visited_at = datetime.now(timezone.utc)

    conn = get_connection()
    try:
        _ensure_table(conn)
        conn.execute(
            "INSERT INTO visitors (ip, country, province, city, isp, country_code, visited_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                ip,
                geo["country"],
                geo["province"],
                geo["city"],
                geo["isp"],
                geo["country_code"],
                visited_at.isoformat(),
            ),
        )
        conn.commit()
    finally:
        conn.close()

    return {
        "ip": ip,
        **geo,
        "visited_at": _format_cn(visited_at),
    }


def list_visitors(limit: int = 200) -> list[dict[str, str]]:
    """只返回中国大陆的访问者，按 IP 去重（每个 IP 取最近一次），时间倒序。"""
    if _remote_enabled():
        data = _remote_get("/api/visitor/list", {"limit": limit})
        return data.get("visitors", [])
    conn = get_connection()
    try:
        _ensure_table(conn)
        rows = conn.execute(
            "SELECT ip, country, province, city, isp, country_code, visited_at "
            "FROM visitors WHERE country = ? ORDER BY id DESC",
            ("中国",),
        ).fetchall()
    finally:
        conn.close()

    seen: set[str] = set()
    visitors: list[dict[str, str]] = []
    for row in rows:
        if row["ip"] in seen:
            continue
        seen.add(row["ip"])
        visitors.append(
            {
                "ip": row["ip"],
                "country": row["country"],
                "province": row["province"],
                "city": row["city"],
                "isp": row["isp"],
                "country_code": row["country_code"],
                "visited_at": _format_cn(datetime.fromisoformat(row["visited_at"])),
            }
        )
        if len(visitors) >= limit:
            break
    return visitors


def summary() -> dict:
    """访问量统计：总量、去重 IP、以及中国省份分布。"""
    if _remote_enabled():
        return _remote_get("/api/visitor/summary", {})
    conn = get_connection()
    try:
        _ensure_table(conn)
        total_visits = conn.execute("SELECT COUNT(*) AS n FROM visitors").fetchone()["n"]
        unique_ips = conn.execute("SELECT COUNT(DISTINCT ip) AS n FROM visitors").fetchone()["n"]
        china_visits = conn.execute(
            "SELECT COUNT(*) AS n FROM visitors WHERE country = ?", ("中国",)
        ).fetchone()["n"]
        china_unique = conn.execute(
            "SELECT COUNT(DISTINCT ip) AS n FROM visitors WHERE country = ?", ("中国",)
        ).fetchone()["n"]
        province_rows = conn.execute(
            "SELECT province, COUNT(DISTINCT ip) AS visitors, COUNT(*) AS visits "
            "FROM visitors WHERE country = ? AND province != '' "
            "GROUP BY province ORDER BY visitors DESC, visits DESC",
            ("中国",),
        ).fetchall()
    finally:
        conn.close()

    return {
        "total_visits": total_visits,
        "unique_ips": unique_ips,
        "china_visits": china_visits,
        "china_unique": china_unique,
        "provinces": [
            {"province": row["province"], "visitors": row["visitors"], "visits": row["visits"]}
            for row in province_rows
        ],
    }


def _format_cn(dt: datetime) -> str:
    """把 UTC 时间格式化为北京时间（Asia/Shanghai）。"""
    return dt.astimezone(CN_TZ).strftime("%Y-%m-%d %H:%M:%S")
