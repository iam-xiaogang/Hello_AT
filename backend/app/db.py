"""Persistence seam.

Tools that need history can obtain a connection here.  This module is
deliberately small so SQLite can later be replaced with PostgreSQL centrally.

The runtime database lives in ``backend/data/toolbox.db`` (gitignored);
override its location with the ``TOOLBOX_DB_PATH`` environment variable.
"""

import os
import sqlite3
from pathlib import Path

_DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DB_PATH = Path(os.environ.get("TOOLBOX_DB_PATH", str(_DATA_DIR / "toolbox.db")))


def get_connection() -> sqlite3.Connection:
    """Return a SQLite connection whose rows are accessible by column name."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn
