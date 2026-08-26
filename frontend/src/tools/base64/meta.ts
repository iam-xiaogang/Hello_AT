import { Binary } from "lucide-react";
import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "base64",
  name: "Base64 编码解码",
  description: "在本地转换文本与 Base64。",
  icon: Binary,
  category: "代码工具",
  path: "/tools/base64",
  kind: "frontend-only",
  accent: "from-indigo-400 to-violet-500",
};
