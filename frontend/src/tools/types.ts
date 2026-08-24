import type { ComponentType } from "react";
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
}

export interface ToolDefinition { meta: ToolMeta; Component: ComponentType }
