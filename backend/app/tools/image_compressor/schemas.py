from pydantic import BaseModel, Field


class CompressionOptions(BaseModel):
    quality: int = Field(default=80, ge=1, le=95)
