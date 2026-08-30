import { CaseSensitive } from "lucide-react";
import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "text-utils",
  name: "文本处理",
  description: "大小写转换、JSON/URL/HTML 转义、行去重排序与文本统计。",
  icon: CaseSensitive,
  category: "实用工具",
  path: "/tools/text-utils",
  kind: "frontend-only",
  accent: "from-emerald-400 to-green-600",
};
