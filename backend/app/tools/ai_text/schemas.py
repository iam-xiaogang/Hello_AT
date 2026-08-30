from typing import Literal

from pydantic import BaseModel, Field


class AiTextRequest(BaseModel):
    action: Literal["translate", "polish", "summarize", "proofread"] = Field(
        description="操作类型：translate 翻译 / polish 润色 / summarize 总结 / proofread 纠错"
    )
    text: str = Field(..., min_length=1, max_length=20000, description="待处理文本")
    target: Literal["中文", "英文", "日语", "韩语", "法语", "德语", "西班牙语"] = "中文"
