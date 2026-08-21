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
}

export interface ToolDefinition { meta: ToolMeta; Component: ComponentType }
