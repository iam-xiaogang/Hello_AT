from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralised settings; environment variables may override these values."""

    api_prefix: str = "/api"
    cors_origins: list[str] = ["http://localhost:5173"]

    # 访问者统计：配置后走 h3blog 的 /api/visitor/* 接口（跨项目共享数据），
    # 留空则使用本地 SQLite + ip2region 兜底实现。
    visitor_api_base: str = "https://iamxiaogang.cn"
    visitor_api_token: str = "iamxiaogang"

    # 访问埋点限流：每 IP 每分钟最多记录次数（防刷库）
    visitor_record_rate_limit: int = 5

    # AI 文本处理（翻译/润色/总结/纠错）：OpenAI 兼容的 Chat Completions 接口
    ai_api_base: str = "https://api.deepseek.com/v1"
    # ⚠️ 密钥请通过环境变量 / .env 的 TOOLBOX_AI_API_KEY 提供，不要写死在代码里
    ai_api_key: str = ""
    ai_model: str = "deepseek-chat"
    # 可选：额外访问令牌（配置后需携带 X-Api-Token 请求头，防止他人消耗你的 AI 额度）
    ai_api_token: str = ""
    # AI 接口限流：每 IP 每小时最多请求次数
    ai_rate_limit: int = 30

    # 博客后台管理令牌：配置后写操作（新建/编辑/删除文章）需携带 X-Blog-Token
    blog_admin_token: str = "iamxiaogang"

    # 博客图片上传：保存目录（默认 backend/data/blog-images，已 gitignore）与大小上限
    blog_image_dir: str = ""
    blog_image_max_bytes: int = 5 * 1024 * 1024

    model_config = SettingsConfigDict(env_file=".env", env_prefix="TOOLBOX_")


settings = Settings()
