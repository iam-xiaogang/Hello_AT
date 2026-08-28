import { MapPin } from "lucide-react";
import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "visitor-tracker",
  name: "访问者统计",
  description: "记录并展示访问者 IP、时间与所在省份（仅中国大陆）。",
  icon: MapPin,
  category: "数据工具",
  path: "/tools/visitor-tracker",
  kind: "needs-backend",
  accent: "from-orange-400 to-rose-500",
};
