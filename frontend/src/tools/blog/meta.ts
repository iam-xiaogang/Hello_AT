import { BookOpen } from "lucide-react";
import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "blog",
  name: "博客",
  description: "我的博客文章展示。",
  icon: BookOpen,
  category: "博客",
  path: "/tools/blog",
  kind: "needs-backend",
  externalUrl: "https://iamxiaogang.cn/",
};
