import { lazy } from "react";
import { meta as jsonFormatter } from "./json-formatter/meta";
import { meta as base64 } from "./base64/meta";
import { meta as imageCompressor } from "./image-compressor/meta";
import { meta as docConverter } from "./doc-converter/meta";
import { meta as news } from "./news/meta";
import { meta as englishLearning } from "./english-learning/meta";
import { meta as blog } from "./blog/meta";
import { meta as visitorTracker } from "./visitor-tracker/meta";
import { meta as qrCode } from "./qr-code/meta";
import { meta as timestamp } from "./timestamp/meta";
import { meta as regexTester } from "./regex-tester/meta";
import { meta as colorTools } from "./color-tools/meta";
import { meta as textDiff } from "./text-diff/meta";
import { meta as textUtils } from "./text-utils/meta";
import { meta as imageProcessor } from "./image-processor/meta";
import { meta as aiText } from "./ai-text/meta";
import { meta as tts } from "./tts/meta";
import { meta as aiChat } from "./ai-chat/meta";
import type { ToolDefinition } from "./types";

// 组件全部路由级懒加载：每个工具一个独立 chunk，访问对应路由时才加载。
// meta 保持同步引入（侧边栏/欢迎页/顶栏只需要 meta）。
const JsonFormatter = lazy(() => import("./json-formatter"));
const Base64Codec = lazy(() => import("./base64"));
const ImageCompressor = lazy(() => import("./image-compressor"));
const DocConverter = lazy(() => import("./doc-converter"));
const DailyNews = lazy(() => import("./news"));
const EnglishLearning = lazy(() => import("./english-learning"));
const Blog = lazy(() => import("./blog"));
const VisitorTracker = lazy(() => import("./visitor-tracker"));
const QrCodeTool = lazy(() => import("./qr-code"));
const TimestampTool = lazy(() => import("./timestamp"));
const RegexTester = lazy(() => import("./regex-tester"));
const ColorTools = lazy(() => import("./color-tools"));
const TextDiff = lazy(() => import("./text-diff"));
const TextUtils = lazy(() => import("./text-utils"));
const ImageProcessor = lazy(() => import("./image-processor"));
const AiText = lazy(() => import("./ai-text"));
const Tts = lazy(() => import("./tts"));
const AiChat = lazy(() => import("./ai-chat"));

// This is the sole front-end registration point. To add a tool, create its
// directory (index.tsx + meta.ts) and add one entry here; navigation, welcome
// cards and routes below are all generated from this same source of truth.
export const tools: ToolDefinition[] = [
  { meta: jsonFormatter, Component: JsonFormatter },
  { meta: base64, Component: Base64Codec },
  { meta: imageCompressor, Component: ImageCompressor },
  { meta: docConverter, Component: DocConverter },
  { meta: news, Component: DailyNews },
  { meta: englishLearning, Component: EnglishLearning },
  { meta: blog, Component: Blog },
  { meta: visitorTracker, Component: VisitorTracker },
  { meta: qrCode, Component: QrCodeTool },
  { meta: timestamp, Component: TimestampTool },
  { meta: regexTester, Component: RegexTester },
  { meta: colorTools, Component: ColorTools },
  { meta: textDiff, Component: TextDiff },
  { meta: textUtils, Component: TextUtils },
  { meta: imageProcessor, Component: ImageProcessor },
  { meta: aiText, Component: AiText },
  { meta: tts, Component: Tts },
  { meta: aiChat, Component: AiChat },
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
