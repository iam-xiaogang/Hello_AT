import { Newspaper } from "lucide-react";
import type { ToolMeta } from "../types";

export const meta: ToolMeta = { id: "daily-news", name: "Daily News", description: "每日国内国际新闻看板。", icon: Newspaper, category: "信息阅读", path: "/tools/news", kind: "needs-backend" };
