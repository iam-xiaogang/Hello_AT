import { GraduationCap } from "lucide-react";
import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "english-learning",
  name: "英语学习",
  description: "与 AI 英语老师对话，练习口语、语法和翻译。",
  icon: GraduationCap,
  category: "AI 工具",
  path: "/tools/english-learning",
  kind: "needs-backend",
  externalUrl: import.meta.env.VITE_ENGLISH_LEARNING_URL || "http://154.36.185.251:8501/english-learning",
};
