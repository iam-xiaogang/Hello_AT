import { Sparkles } from "lucide-react";
import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "ai-text",
  name: "AI 文本处理",
  description: "AI 翻译、润色、总结要点、纠错，支持中英日韩等多语言。",
  icon: Sparkles,
  category: "AI 工具",
  path: "/tools/ai-text",
  kind: "needs-backend",
  accent: "from-purple-400 to-indigo-600",
};
