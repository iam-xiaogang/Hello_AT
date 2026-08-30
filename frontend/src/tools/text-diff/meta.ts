import { Diff } from "lucide-react";
import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "text-diff",
  name: "文本对比",
  description: "两段文本逐行、逐字对比差异，高亮增删内容。",
  icon: Diff,
  category: "代码工具",
  path: "/tools/text-diff",
  kind: "frontend-only",
  accent: "from-amber-400 to-orange-600",
};
