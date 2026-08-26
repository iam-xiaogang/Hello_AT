// 工具清单与分类（首页网格和侧边栏共用同一份数据）。
const { NEWS_URL, ENGLISH_URL, BLOG_URL } = require("../config");

const TOOLS = [
  {
    id: "json", name: "JSON 格式化", desc: "格式化、压缩并校验 JSON", icon: "{}",
    color1: "#22d3ee", color2: "#0ea5e9", url: "/pages/json/index",
  },
  {
    id: "base64", name: "Base64 编解码", desc: "文本与 Base64 互转", icon: "🔤",
    color1: "#818cf8", color2: "#8b5cf6", url: "/pages/base64/index",
  },
  {
    id: "compress", name: "图片压缩", desc: "本地压缩 JPG 图片", icon: "🖼️",
    color1: "#38bdf8", color2: "#3b82f6", url: "/pages/compress/index",
  },
  {
    id: "convert", name: "文档转换", desc: "PDF / Word 转文本或 Word", icon: "📄",
    color1: "#2dd4bf", color2: "#06b6d4", url: "/pages/convert/index",
  },
  {
    id: "news", name: "Daily News", desc: "每日国内外新闻", icon: "📰",
    color1: "#34d399", color2: "#14b8a6",
    url: "/pages/webview/index?src=" + encodeURIComponent(NEWS_URL),
  },
  {
    id: "english", name: "英语学习", desc: "AI 英语老师", icon: "🧑‍🏫",
    color1: "#60a5fa", color2: "#6366f1",
    url: "/pages/webview/index?src=" + encodeURIComponent(ENGLISH_URL),
  },
  {
    id: "blog", name: "博客", desc: "我的博客文章", icon: "📚",
    color1: "#a78bfa", color2: "#a855f7",
    url: "/pages/webview/index?src=" + encodeURIComponent(BLOG_URL),
  },
];

// 分类顺序与归属（与 Web 端侧边栏一致：AI 工具置顶）。
const CATEGORY_ORDER = ["AI 工具", "代码工具", "文件工具", "博客"];
const CATEGORY_ITEMS = {
  "AI 工具": ["news", "english"],
  "代码工具": ["json", "base64"],
  "文件工具": ["compress", "convert"],
  "博客": ["blog"],
};

function byCategory() {
  return CATEGORY_ORDER.map((name) => ({
    name,
    items: CATEGORY_ITEMS[name].map((id) => TOOLS.find((t) => t.id === id)),
  }));
}

module.exports = { TOOLS, byCategory };
