from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(..., description="user / assistant")
    content: str = Field("", max_length=20_000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(..., min_length=1, max_length=100)
