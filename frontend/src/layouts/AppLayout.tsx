import { ExternalLink, Menu, Search, Settings, Wrench } from "lucide-react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { useUiStore } from "../state/ui";
import { tools } from "../tools/registry";

export function AppLayout() {
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const location = useLocation();
  const tool = tools.find((t) => t.meta.path === location.pathname);
  const Icon = tool?.meta.icon;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-400 px-4 text-white shadow-lg shadow-violet-200/50 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button className="rounded-lg p-2 text-white/90 hover:bg-white/20 lg:hidden" aria-label="打开菜单" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            {tool ? (
              <>
                {Icon && (
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${tool.meta.accent} text-white shadow-md`}>
                    <Icon size={17} />
                  </span>
                )}
                <div className="min-w-0">
                  <h1 className="truncate font-semibold leading-tight drop-shadow-sm">{tool.meta.name}</h1>
                  <p className="truncate text-xs text-white/75">{tool.meta.description}</p>
                </div>
              </>
            ) : (
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/20 shadow-inner">
                <Wrench size={17} />
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-white/90">
            {/* {tool && (
              <a
                className="mr-1 inline-flex items-center gap-1.5 rounded-lg border border-white/40 bg-white/15 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/25"
                href={tool.meta.externalUrl ?? tool.meta.path}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink size={15} />
                <span className="hidden sm:inline">独立打开</span>
              </a>
            )} */}
            <button className="rounded-lg p-2 hover:bg-white/20" aria-label="搜索（即将推出）">
              <Search size={19} />
            </button>
            <button className="rounded-lg p-2 hover:bg-white/20" aria-label="设置（即将推出）">
              <Settings size={19} />
            </button>
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
