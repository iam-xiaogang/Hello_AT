import JsonFormatter from "./json-formatter";
import { meta as jsonFormatter } from "./json-formatter/meta";
import dailyNews from "./news";
import { meta as news } from "./news/meta";
import EnglishLearning from "./english-learning";
import { meta as englishLearning } from "./english-learning/meta";
import Base64Codec from "./base64";
import { meta as base64 } from "./base64/meta";
import ImageCompressor from "./image-compressor";
import { meta as imageCompressor } from "./image-compressor/meta";
import DocConverter from "./doc-converter";
import { meta as docConverter } from "./doc-converter/meta";
import Blog from "./blog";
import { meta as blog } from "./blog/meta";
import VisitorTracker from "./visitor-tracker";
import { meta as visitorTracker } from "./visitor-tracker/meta";
import type { ToolDefinition } from "./types";

// This is the sole front-end registration point. To add a tool, create its
// directory (index.tsx + meta.ts) and add one entry here; navigation, welcome
// cards and routes below are all generated from this same source of truth.
export const tools: ToolDefinition[] = [
  { meta: jsonFormatter, Component: JsonFormatter },
  { meta: base64, Component: Base64Codec },
  { meta: imageCompressor, Component: ImageCompressor },
  { meta: docConverter, Component: DocConverter },
  { meta: news, Component: dailyNews },
  { meta: englishLearning, Component: EnglishLearning },
  { meta: blog, Component: Blog },
  { meta: visitorTracker, Component: VisitorTracker },
];

// AI tools and the blog lead the sidebar regardless of their registration order below.
const CATEGORY_PRIORITY = ["AI 工具", "博客"];

export const toolsByCategory = Object.entries(
  tools.reduce<Record<string, ToolDefinition[]>>((groups, tool) => {
    (groups[tool.meta.category] ??= []).push(tool);
    return groups;
  }, {}),
).sort(([a], [b]) => {
  const ia = CATEGORY_PRIORITY.indexOf(a);
  const ib = CATEGORY_PRIORITY.indexOf(b);
  return (ia === -1 ? CATEGORY_PRIORITY.length : ia) - (ib === -1 ? CATEGORY_PRIORITY.length : ib);
});
