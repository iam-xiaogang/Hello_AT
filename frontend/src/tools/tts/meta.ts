import { AudioLines } from "lucide-react";
import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "tts",
  name: "文字转语音",
  description: "浏览器本地语音合成朗读文本，支持中文等多种语音，无需后端。",
  icon: AudioLines,
  category: "实用工具",
  path: "/tools/tts",
  kind: "frontend-only",
  accent: "from-teal-400 to-emerald-600",
};
