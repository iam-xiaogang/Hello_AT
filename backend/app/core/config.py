from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralised settings; environment variables may override these values."""

    api_prefix: str = "/api"
    cors_origins: list[str] = ["http://localhost:5173"]

    # 访问者统计：配置后走 h3blog 的 /api/visitor/* 接口（跨项目共享数据），
    # 留空则使用本地 SQLite + ip2region 兜底实现。
    visitor_api_base: str = "https://iamxiaogang.cn"
    visitor_api_token: str = "iamxiaogang"

    model_config = SettingsConfigDict(env_file=".env", env_prefix="TOOLBOX_")


settings = Settings()
