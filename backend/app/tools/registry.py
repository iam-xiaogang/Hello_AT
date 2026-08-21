"""Automatic router discovery for tools.

A backend-capable tool needs only a package in ``app.tools`` containing a
``router.py`` which exposes ``router = APIRouter(...)``.  This importer scans
the package at startup, keeping main.py closed to future tool changes.
"""
from importlib import import_module
from pkgutil import iter_modules

from fastapi import APIRouter


def discover_tool_routers() -> list[APIRouter]:
    import app.tools as tools_package

    routers: list[APIRouter] = []
    for module in iter_modules(tools_package.__path__):
        if not module.ispkg or module.name.startswith("_"):
            continue
        router_module = import_module(f"{tools_package.__name__}.{module.name}.router")
        router = getattr(router_module, "router", None)
        if not isinstance(router, APIRouter):
            raise RuntimeError(f"工具 {module.name} 的 router.py 必须导出 APIRouter 实例 router")
        routers.append(router)
    return routers
