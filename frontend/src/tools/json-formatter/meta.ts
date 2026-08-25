import { Braces } from "lucide-react";
import type { ToolMeta } from "../types";

export const meta: ToolMeta = { id: "json-formatter", name: "JSON 格式化 / 校验", description: "格式化、压缩并校验 JSON 数据。", icon: Braces, category: "代码工具", path: "/tools/json-formatter", kind: "frontend-only" };
