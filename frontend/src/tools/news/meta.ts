import { Newspaper } from "lucide-react";
import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "daily-news",
  name: "Daily News",
  description: "每日国内国际新闻看板。",
  icon: Newspaper,
  category: "AI 工具",
  path: "/tools/news",
  kind: "needs-backend",
  // Same-origin path, proxied by nginx/Vite to the external Flask service.
  // This avoids the browser blocking an http:// iframe inside an https page
  // (mixed content). Override with VITE_DAILY_NEWS_URL for a public URL.
  // externalUrl: import.meta.env.VITE_DAILY_NEWS_URL || "http://154.36.185.251:5001",
  externalUrl: import.meta.env.VITE_DAILY_NEWS_URL || "/news/",
};
