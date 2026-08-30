from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralised settings; environment variables may override these values."""

    api_prefix: str = "/api"
    cors_origins: list[str] = ["http://localhost:5173"]

    # 访问者统计：配置后走 h3blog 的 /api/visitor/* 接口（跨项目共享数据），
    # 留空则使用本地 SQLite + ip2region 兜底实现。
    visitor_api_base: str = "https://iamxiaogang.cn"
    visitor_api_token: str = "iamxiaogang"

    # AI 文本处理（翻译/润色/总结/纠错）：OpenAI 兼容的 Chat Completions 接口
    ai_api_base: str = "https://api.deepseek.com/v1"
    ai_api_key: str = "sk-3d4d52d3eda0499bb9b4f95fd46c4f81"
    ai_model: str = "deepseek-chat"

    model_config = SettingsConfigDict(env_file=".env", env_prefix="TOOLBOX_")


settings = Settings()
