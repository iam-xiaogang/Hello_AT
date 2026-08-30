import type { ComponentType, LazyExoticComponent } from "react";
import type { LucideIcon } from "lucide-react";

export type ToolKind = "frontend-only" | "needs-backend";

export interface ToolMeta {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: string;
  path: string;
  kind: ToolKind;
  /** When set, "独立打开" opens this URL in a new tab; otherwise the tool's own route. */
  externalUrl?: string;
  /** Tailwind gradient stops (e.g. "from-pink-400 to-rose-500") for the tool's
   * dopamine accent color. Used by icon chips, active sidebar item, etc. */
  accent: string;
}

/** 工具组件：路由级懒加载，渲染时由 <Suspense> 包裹。 */
export type ToolComponent = ComponentType | LazyExoticComponent<ComponentType>;

export interface ToolDefinition { meta: ToolMeta; Component: ToolComponent }
