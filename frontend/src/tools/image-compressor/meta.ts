import { ImageDown } from "lucide-react";
import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "image-compressor",
  name: "图片压缩",
  description: "上传图片，通过服务端压缩后下载。",
  icon: ImageDown,
  category: "文件工具",
  path: "/tools/image-compressor",
  kind: "needs-backend",
  accent: "from-sky-400 to-blue-500",
};
