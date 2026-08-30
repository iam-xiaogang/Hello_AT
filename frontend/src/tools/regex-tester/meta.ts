import { Regex } from "lucide-react";
import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "regex-tester",
  name: "正则测试",
  description: "实时测试正则表达式，高亮匹配结果并展示分组。",
  icon: Regex,
  category: "代码工具",
  path: "/tools/regex-tester",
  kind: "frontend-only",
  accent: "from-fuchsia-400 to-purple-600",
};
