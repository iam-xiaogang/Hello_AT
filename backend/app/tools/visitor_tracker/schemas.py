from pydantic import BaseModel


class VisitorRecord(BaseModel):
    """一条访问记录（用于接口响应）。"""

    ip: str
    country: str
    province: str
    city: str
    isp: str
    country_code: str
    visited_at: str  # Asia/Shanghai, "YYYY-MM-DD HH:MM:SS"


class ProvinceStat(BaseModel):
    province: str
    visitors: int  # 去重 IP 数
    visits: int  # 总访问次数


class VisitorSummary(BaseModel):
    total_visits: int
    unique_ips: int
    china_visits: int
    china_unique: int
    provinces: list[ProvinceStat]
