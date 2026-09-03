from pydantic import BaseModel, Field


class ArticleCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    category: str = Field("", max_length=50)
    summary: str = Field("", max_length=500)
    content: str = Field("", max_length=200_000)
    published_at: str = Field("", max_length=30, description="发布时间（datetime-local 字符串，如 2026-08-01T10:00）")


class ArticleUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    category: str | None = Field(None, max_length=50)
    summary: str | None = Field(None, max_length=500)
    content: str | None = Field(None, max_length=200_000)
    published_at: str | None = Field(None, max_length=30)
