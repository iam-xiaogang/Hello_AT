import { QrCode } from "lucide-react";
import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "qr-code",
  name: "二维码",
  description: "文本生成二维码，或从图片中识别二维码内容。",
  icon: QrCode,
  category: "实用工具",
  path: "/tools/qr-code",
  kind: "frontend-only",
  accent: "from-indigo-400 to-blue-600",
};
