"""Gunicorn configuration for the Toolbox FastAPI backend.

Run from the backend/ directory:
    gunicorn -c gunicorn.conf.py app.main:app
"""
import multiprocessing

# Bind to loopback only; nginx (or another reverse proxy) fronts the public.
bind = "127.0.0.1:8000"

# Rule of thumb: 2 × CPU cores + 1; keep modest on small VPS.
workers = 2

# ASGI: gunicorn needs the uvicorn worker to speak ASGI for FastAPI.
worker_class = "uvicorn.workers.UvicornWorker"

# PDF→Word conversions (pdf2docx) can take a while; default 30s would kill them.
timeout = 300
graceful_timeout = 30

# Log to stdout so systemd/journald or nohup captures them.
accesslog = "-"
errorlog = "-"
