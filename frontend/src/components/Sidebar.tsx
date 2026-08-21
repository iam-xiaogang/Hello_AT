import { NavLink } from "react-router-dom";
import { X } from "lucide-react";
import { toolsByCategory } from "../tools/registry";
import { useUiStore } from "../state/ui";

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUiStore();
  const navigation = <nav className="space-y-6 p-4">{toolsByCategory.map(([category, items]) => <div key={category}><p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{category}</p><div className="space-y-1">{items.map(({ meta }) => { const Icon = meta.icon; return <NavLink key={meta.id} to={meta.path} onClick={() => setSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}><Icon size={18}/><span>{meta.name}</span>{meta.kind === "needs-backend" && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" title="需要后端"/>}</NavLink>; })}</div></div>)}</nav>;
  return <><aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">{navigation}</aside><div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? "" : "pointer-events-none"}`}><div className={`absolute inset-0 bg-slate-900/30 transition-opacity ${sidebarOpen ? "opacity-100" : "opacity-0"}`} onClick={() => setSidebarOpen(false)}/><aside className={`absolute inset-y-0 left-0 w-72 bg-white shadow-xl transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}><div className="flex h-16 items-center justify-end border-b border-slate-200 px-4"><button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => setSidebarOpen(false)} aria-label="关闭菜单"><X size={20}/></button></div>{navigation}</aside></div></>;
}
