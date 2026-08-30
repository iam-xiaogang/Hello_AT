import { Palette } from "lucide-react";
import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "color-tools",
  name: "颜色转换",
  description: "HEX / RGB / HSL 颜色互转，带取色器与常用色板。",
  icon: Palette,
  category: "实用工具",
  path: "/tools/color-tools",
  kind: "frontend-only",
  accent: "from-rose-400 to-pink-600",
};
