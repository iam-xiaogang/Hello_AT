import { Clock } from "lucide-react";
import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "timestamp",
  name: "时间戳",
  description: "时间戳与日期互转，自动识别秒/毫秒，多种格式展示。",
  icon: Clock,
  category: "实用工具",
  path: "/tools/timestamp",
  kind: "frontend-only",
  accent: "from-cyan-400 to-teal-600",
};
