from pydantic import BaseModel, Field


class ArticleCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    category: str = Field("", max_length=50)
    summary: str = Field("", max_length=500)
    content: str = Field("", max_length=200_000)


class ArticleUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    category: str | None = Field(None, max_length=50)
    summary: str | None = Field(None, max_length=500)
    content: str | None = Field(None, max_length=200_000)
