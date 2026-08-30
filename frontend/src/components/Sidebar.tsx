import { NavLink } from "react-router-dom";
import { ChevronsLeft, ChevronsRight, X } from "lucide-react";
import { toolsByCategory } from "../tools/registry";
import { useUiStore } from "../state/ui";

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate: () => void }) {
  return (
    <nav className="space-y-6 p-4">
      {toolsByCategory.map(([category, items]) => (
        <div key={category}>
          {!collapsed && <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{category}</p>}
          <div className="space-y-1">
            {items.map(({ meta }) => {
              const Icon = meta.icon;
              return (
                <NavLink
                  key={meta.id}
                  to={meta.path}
                  title={collapsed ? meta.name : undefined}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition ${collapsed ? "justify-center" : ""} ${
                      isActive
                        ? `bg-gradient-to-r ${meta.accent} text-white shadow-md shadow-violet-200/60`
                        : "text-slate-600 hover:bg-white/90 hover:text-slate-900 hover:shadow-sm"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white shadow-sm transition group-hover:scale-105 ${
                          isActive ? "bg-white/25" : `bg-gradient-to-br ${meta.accent}`
                        }`}
                      >
                        <Icon size={17} />
                      </span>
                      {!collapsed && (
                        <>
                          <span className="truncate">{meta.name}</span>
                          {meta.kind === "needs-backend" && (
                            <span
                              className={`ml-auto h-1.5 w-1.5 shrink-0 rounded-full ${isActive ? "bg-white" : "bg-emerald-500"}`}
                              title="需要后端"
                            />
                          )}
                        </>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleSidebarCollapsed } = useUiStore();
  return (
    <>
      <aside
        className={`hidden shrink-0 flex-col border-r border-white/70 bg-gradient-to-b from-violet-100/90 via-white/85 to-sky-50/90 backdrop-blur transition-[width] duration-200 lg:sticky lg:top-0 lg:flex lg:h-screen ${sidebarCollapsed ? "w-16" : "w-64"}`}
      >
        <div className={`flex h-16 shrink-0 items-center border-b border-white/70 ${sidebarCollapsed ? "justify-center" : "justify-end pr-2"}`}>
          <button
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/90 hover:text-violet-500"
            onClick={toggleSidebarCollapsed}
            aria-label={sidebarCollapsed ? "展开侧边栏" : "折叠侧边栏"}
            title={sidebarCollapsed ? "展开侧边栏" : "折叠侧边栏"}
          >
            {sidebarCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <NavList collapsed={sidebarCollapsed} onNavigate={() => {}} />
        </div>
      </aside>
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? "" : "pointer-events-none"}`}>
        <div
          className={`absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity ${sidebarOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setSidebarOpen(false)}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-72 flex-col bg-gradient-to-b from-violet-50 via-white to-sky-50 shadow-2xl shadow-violet-200/40 backdrop-blur transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex h-16 shrink-0 items-center justify-end border-b border-slate-100 px-4">
            <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => setSidebarOpen(false)} aria-label="关闭菜单">
              <X size={20} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <NavList collapsed={false} onNavigate={() => setSidebarOpen(false)} />
          </div>
        </aside>
      </div>
    </>
  );
}
