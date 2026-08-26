import { FileText } from "lucide-react";
import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "doc-converter",
  name: "文档转换",
  description: "PDF 与 Word 文档格式互转。",
  icon: FileText,
  category: "文件工具",
  path: "/tools/doc-converter",
  kind: "needs-backend",
  accent: "from-teal-400 to-cyan-500",
};
