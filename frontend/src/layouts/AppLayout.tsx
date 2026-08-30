import { useEffect } from "react";
import { Home, Menu, Wrench } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { useUiStore } from "../state/ui";
import { tools } from "../tools/registry";

export function AppLayout() {
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const location = useLocation();
  const tool = tools.find((t) => t.meta.path === location.pathname);
  const Icon = tool?.meta.icon;

  // 访问埋点：每次页面加载记录一次访问者（IP/时间/省份），失败静默忽略。
  useEffect(() => {
    fetch("/api/tools/visitor-tracker/record", { method: "POST", keepalive: true }).catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-400 px-4 text-white shadow-lg shadow-violet-200/50 sm:px-7">
          <div className="flex min-w-0 items-center gap-1.5">
            <Link
              to="/"
              className="mr-1 flex shrink-0 items-center gap-2 rounded-xl px-2 py-1 transition hover:bg-white/15"
              aria-label="回到首页"
              title="回到首页"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-300 via-orange-400 to-rose-400 text-white shadow-md">
                <Home size={19} />
              </span>
              <span className="hidden text-sm font-semibold drop-shadow-sm md:inline">Toolbox</span>
            </Link>
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
        </header>
        <main className="flex min-h-0 flex-1 flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
