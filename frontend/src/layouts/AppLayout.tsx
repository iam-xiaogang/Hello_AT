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
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="打开菜单" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            {tool ? (
              <>
                {Icon && (
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-600 text-white">
                    <Icon size={17} />
                  </span>
                )}
                <div className="min-w-0">
                  <h1 className="truncate font-semibold leading-tight">{tool.meta.name}</h1>
                  <p className="truncate text-xs text-slate-500">{tool.meta.description}</p>
                </div>
              </>
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">
                <Wrench size={17} />
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            {/* {tool && (
              <a
                className="mr-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                href={tool.meta.externalUrl ?? tool.meta.path}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink size={15} />
                <span className="hidden sm:inline">独立打开</span>
              </a>
            )} */}
            <button className="rounded-lg p-2 hover:bg-slate-100" aria-label="搜索（即将推出）">
              <Search size={19} />
            </button>
            <button className="rounded-lg p-2 hover:bg-slate-100" aria-label="设置（即将推出）">
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
