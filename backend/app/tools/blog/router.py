from fastapi import APIRouter, File, HTTPException, Query, Request, UploadFile, status
from fastapi.responses import FileResponse

from app.core.config import settings

from . import service
from .schemas import ArticleCreate, ArticleUpdate

router = APIRouter(prefix="/tools/blog", tags=["blog"])


def _check_admin(request: Request) -> None:
    """写操作需要 X-Blog-Token 请求头（未配置令牌则全部拒绝）。"""
    expected = settings.blog_admin_token
    token = request.headers.get("X-Blog-Token", "")
    if not expected or token != expected:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无效的管理令牌（请在 backend/.env 配置 TOOLBOX_BLOG_ADMIN_TOKEN）。",
        )


@router.get("/articles")
async def list_articles(
    category: str = "",
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> dict:
    articles, total = service.list_articles(category, limit, offset)
    return {"articles": articles, "total": total}


@router.get("/articles/{article_id}")
async def get_article(article_id: int) -> dict:
    article = service.get_article(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="文章不存在。")
    return article


@router.get("/categories")
async def categories() -> dict:
    return {"categories": service.categories()}


@router.post("/articles")
async def create_article(request: Request, data: ArticleCreate) -> dict:
    _check_admin(request)
    return service.create_article(data)


@router.post("/images")
async def upload_image(request: Request, file: UploadFile = File(...)) -> dict:
    """上传博客图片（需 X-Blog-Token），返回可直接写入 Markdown 的 URL。"""
    _check_admin(request)
    return await service.save_image(file)


@router.get("/images/{filename}")
async def get_image(filename: str) -> FileResponse:
    found = service.image_file(filename)
    if not found:
        raise HTTPException(status_code=404, detail="图片不存在。")
    path, media_type = found
    return FileResponse(path, media_type=media_type)


@router.put("/articles/{article_id}")
async def update_article(request: Request, article_id: int, data: ArticleUpdate) -> dict:
    _check_admin(request)
    article = service.update_article(article_id, data)
    if not article:
        raise HTTPException(status_code=404, detail="文章不存在。")
    return article


@router.delete("/articles/{article_id}")
async def delete_article(request: Request, article_id: int) -> dict:
    _check_admin(request)
    if not service.delete_article(article_id):
        raise HTTPException(status_code=404, detail="文章不存在。")
    return {"ok": True}
