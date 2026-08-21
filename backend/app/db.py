"""Persistence seam.

Tools that need history can obtain a connection/session here.  This module is
deliberately small so SQLite can later be replaced with PostgreSQL centrally.
"""

# Future home for the application's database engine and session dependency.
