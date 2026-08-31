"""博客文章 CRUD：SQLite 持久化（复用 app.db 连接接缝）。"""

import sqlite3
from datetime import datetime, timezone
from typing import Optional

from app.db import get_connection

SCHEMA = """
CREATE TABLE IF NOT EXISTS blog_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '',
    summary TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
"""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _ensure_table(conn: sqlite3.Connection) -> None:
    conn.execute(SCHEMA)
    conn.commit()


def _row_to_article(row: sqlite3.Row, include_content: bool) -> dict:
    article = {
        "id": row["id"],
        "title": row["title"],
        "category": row["category"],
        "summary": row["summary"],
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
            "INSERT INTO blog_articles (title, category, summary, content, created_at, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (data.title, data.category, data.summary, data.content, now, now),
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
        }
        conn.execute(
            "UPDATE blog_articles SET title = ?, category = ?, summary = ?, content = ?, updated_at = ? WHERE id = ?",
            (fields["title"], fields["category"], fields["summary"], fields["content"], _now(), article_id),
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
