import { GraduationCap } from "lucide-react";
import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "english-learning",
  name: "英语学习",
  description: "与 AI 英语老师对话，练习口语、语法和翻译。",
  icon: GraduationCap,
  category: "学习成长",
  path: "/tools/english-learning",
  kind: "needs-backend",
};
