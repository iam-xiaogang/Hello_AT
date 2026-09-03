"""博客文章 CRUD：SQLite 持久化（复用 app.db 连接接缝）。"""

import re
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings
from app.db import get_connection

SCHEMA = """
CREATE TABLE IF NOT EXISTS blog_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '',
    summary TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    published_at TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
"""

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
_IMAGE_NAME_RE = re.compile(r"^[0-9a-f]{32}\.(jpg|jpeg|png|webp|gif)$")
_IMAGE_MEDIA = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp", "gif": "image/gif"}


def _image_dir() -> Path:
    """博客图片保存目录（默认 backend/data/blog-images，已 gitignore）。"""
    default = Path(__file__).resolve().parent.parent.parent / "data" / "blog-images"
    directory = Path(settings.blog_image_dir) if settings.blog_image_dir else default
    directory.mkdir(parents=True, exist_ok=True)
    return directory


async def save_image(file: UploadFile) -> dict:
    """保存上传的图片，返回可通过 /api/tools/blog/images/<name> 访问的 URL。"""
    ext = ALLOWED_IMAGE_TYPES.get(file.content_type or "")
    if not ext:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="仅支持 JPEG、PNG、WebP、GIF 图片。",
        )
    raw = await file.read(settings.blog_image_max_bytes + 1)
    if not raw:
        raise HTTPException(status_code=400, detail="图片内容为空。")
    if len(raw) > settings.blog_image_max_bytes:
        limit_mb = settings.blog_image_max_bytes // (1024 * 1024)
        raise HTTPException(status_code=413, detail=f"图片不能超过 {limit_mb} MB。")

    filename = uuid.uuid4().hex + ext
    (_image_dir() / filename).write_bytes(raw)
    return {
        "ok": True,
        "name": filename,
        "url": f"/api/tools/blog/images/{filename}",
    }


def image_file(filename: str) -> Optional[tuple[Path, str]]:
    """按文件名返回 (路径, media_type)；非法文件名/不存在返回 None。"""
    if not _IMAGE_NAME_RE.match(filename):
        return None
    path = _image_dir() / filename
    if not path.exists():
        return None
    return path, _IMAGE_MEDIA[filename.rsplit(".", 1)[-1]]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _ensure_table(conn: sqlite3.Connection) -> None:
    conn.execute(SCHEMA)
    # 旧库迁移：补 published_at 列
    cols = {r["name"] for r in conn.execute("PRAGMA table_info(blog_articles)").fetchall()}
    if "published_at" not in cols:
        conn.execute("ALTER TABLE blog_articles ADD COLUMN published_at TEXT NOT NULL DEFAULT ''")
    conn.commit()


def _row_to_article(row: sqlite3.Row, include_content: bool) -> dict:
    article = {
        "id": row["id"],
        "title": row["title"],
        "category": row["category"],
        "summary": row["summary"],
        "published_at": row["published_at"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }
    if include_content:
        article["content"] = row["content"]
    return article


def list_articles(category: str = "", limit: int = 50, offset: int = 0) -> tuple[list[dict], int]:
    """按时间倒序返回文章列表（不含正文），以及总数。"""
    conn = get_connection()
    try:
        _ensure_table(conn)
        where = " WHERE category = ?" if category else ""
        params: list = [category] if category else []
        total = conn.execute(f"SELECT COUNT(*) AS n FROM blog_articles{where}", params).fetchone()["n"]
        rows = conn.execute(
            f"SELECT * FROM blog_articles{where} ORDER BY id DESC LIMIT ? OFFSET ?",
            params + [limit, offset],
        ).fetchall()
    finally:
        conn.close()
    return [_row_to_article(r, include_content=False) for r in rows], total


def get_article(article_id: int) -> Optional[dict]:
    conn = get_connection()
    try:
        _ensure_table(conn)
        row = conn.execute("SELECT * FROM blog_articles WHERE id = ?", (article_id,)).fetchone()
    finally:
        conn.close()
    return _row_to_article(row, include_content=True) if row else None


def categories() -> list[str]:
    """所有非空分类，按文章数倒序。"""
    conn = get_connection()
    try:
        _ensure_table(conn)
        rows = conn.execute(
            "SELECT category, COUNT(*) AS n FROM blog_articles WHERE category != '' "
            "GROUP BY category ORDER BY n DESC, category ASC"
        ).fetchall()
    finally:
        conn.close()
    return [r["category"] for r in rows]


def create_article(data) -> dict:
    now = _now()
    conn = get_connection()
    try:
        _ensure_table(conn)
        cur = conn.execute(
            "INSERT INTO blog_articles (title, category, summary, content, published_at, created_at, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (data.title, data.category, data.summary, data.content, data.published_at, now, now),
        )
        conn.commit()
        article_id = cur.lastrowid
    finally:
        conn.close()
    return get_article(article_id) or {}


def update_article(article_id: int, data) -> Optional[dict]:
    conn = get_connection()
    try:
        _ensure_table(conn)
        row = conn.execute("SELECT * FROM blog_articles WHERE id = ?", (article_id,)).fetchone()
        if not row:
            return None
        fields = {
            "title": data.title if data.title is not None else row["title"],
            "category": data.category if data.category is not None else row["category"],
            "summary": data.summary if data.summary is not None else row["summary"],
            "content": data.content if data.content is not None else row["content"],
            "published_at": data.published_at if data.published_at is not None else row["published_at"],
        }
        conn.execute(
            "UPDATE blog_articles SET title = ?, category = ?, summary = ?, content = ?, published_at = ?, updated_at = ? WHERE id = ?",
            (fields["title"], fields["category"], fields["summary"], fields["content"], fields["published_at"], _now(), article_id),
        )
        conn.commit()
    finally:
        conn.close()
    return get_article(article_id)


def delete_article(article_id: int) -> bool:
    conn = get_connection()
    try:
        _ensure_table(conn)
        cur = conn.execute("DELETE FROM blog_articles WHERE id = ?", (article_id,))
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()
