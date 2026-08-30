"""访问者统计核心逻辑。

数据分库存储、展示时合并加总：
- 工具箱（本项目）的访问 → 本地 SQLite（backend/data/toolbox.db）
- 博客（h3blog）的访问 → 博客库（通过 TOOLBOX_VISITOR_API_BASE 配置的
  /api/visitor/* 接口读取，由博客侧埋点入库）

页面展示 = 本地记录 + 博客记录 的总和；未配置远程地址时仅显示本地记录。
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
# 博客库（远程）：读取博客侧记录
# ---------------------------------------------------------------------------

def _remote_enabled() -> bool:
    return bool(settings.visitor_api_base)


def _remote_url(path: str) -> str:
    return settings.visitor_api_base.rstrip("/") + path


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
            detail=f"访问统计服务（博客）暂不可用: {exc}",
        ) from exc
    return resp.json()


# ---------------------------------------------------------------------------
# 本地库（工具箱自身）
# ---------------------------------------------------------------------------

def _ensure_table(conn: sqlite3.Connection) -> None:
    conn.execute(SCHEMA)
    conn.commit()


def _local_record(ip: str) -> Optional[dict[str, str]]:
    """工具箱访问记入本地 SQLite。"""
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


def _local_list(limit: int = 200) -> list[dict[str, str]]:
    """本地库的中国大陆访问者，按 IP 去重（每个 IP 取最近一次），时间倒序。"""
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


def _local_summary() -> dict:
    """本地库的访问量统计。"""
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


# ---------------------------------------------------------------------------
# 对外接口：合并本地 + 博客两库
# ---------------------------------------------------------------------------

def record_visit(ip: str) -> Optional[dict[str, str]]:
    """记录一次工具箱访问（始终记本地库；博客访问由博客侧埋点记入博客库）。"""
    return _local_record(ip)


def _merge_visitors(
    local: list[dict[str, str]], remote: list[dict[str, str]], limit: int
) -> list[dict[str, str]]:
    """合并两个列表：按 IP 去重（保留最近一次），按时间倒序。"""
    by_ip: dict[str, dict[str, str]] = {}
    for v in local + remote:
        current = by_ip.get(v["ip"])
        if current is None or v["visited_at"] > current["visited_at"]:
            by_ip[v["ip"]] = v
    return sorted(by_ip.values(), key=lambda v: v["visited_at"], reverse=True)[:limit]


def list_visitors(limit: int = 200) -> list[dict[str, str]]:
    """本地 + 博客两库的中国大陆访问者合并列表（按 IP 去重，时间倒序）。"""
    local = _local_list(limit * 2)
    if not _remote_enabled():
        return local[:limit]
    data = _remote_get("/api/visitor/list", {"limit": limit * 2})
    remote = data.get("visitors", [])
    return _merge_visitors(local, remote, limit)


def _merge_summary(local: dict, remote: dict) -> dict:
    """两库统计加总：计数相加，省份分布按省合并。"""
    provinces: dict[str, dict[str, int]] = {}
    for p in local.get("provinces", []) + remote.get("provinces", []):
        name = p["province"]
        if name in provinces:
            provinces[name]["visitors"] += p["visitors"]
            provinces[name]["visits"] += p["visits"]
        else:
            provinces[name] = dict(p)

    return {
        "total_visits": local.get("total_visits", 0) + remote.get("total_visits", 0),
        "unique_ips": local.get("unique_ips", 0) + remote.get("unique_ips", 0),
        "china_visits": local.get("china_visits", 0) + remote.get("china_visits", 0),
        "china_unique": local.get("china_unique", 0) + remote.get("china_unique", 0),
        "provinces": sorted(
            provinces.values(), key=lambda p: (-p["visitors"], -p["visits"])
        ),
    }


def summary() -> dict:
    """本地 + 博客两库的访问量统计之和。"""
    local = _local_summary()
    if not _remote_enabled():
        return local
    return _merge_summary(local, _remote_get("/api/visitor/summary", {}))


def _format_cn(dt: datetime) -> str:
    """把 UTC 时间格式化为北京时间（Asia/Shanghai）。"""
    return dt.astimezone(CN_TZ).strftime("%Y-%m-%d %H:%M:%S")
