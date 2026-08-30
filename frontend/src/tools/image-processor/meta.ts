import { Images } from "lucide-react";
import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "image-processor",
  name: "图片批量处理",
  description: "批量转换格式、缩放、加水印、圆角处理，可打包 ZIP 下载。",
  icon: Images,
  category: "文件工具",
  path: "/tools/image-processor",
  kind: "frontend-only",
  accent: "from-sky-400 to-blue-600",
};
