import { MessageSquare } from "lucide-react";
import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "ai-chat",
  name: "AI 对话",
  description: "AI 智能助手，流式对话问答，支持 Markdown 回复。",
  icon: MessageSquare,
  category: "AI 工具",
  path: "/tools/ai-chat",
  kind: "needs-backend",
  accent: "from-blue-400 to-indigo-600",
};
