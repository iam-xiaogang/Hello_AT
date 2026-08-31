import { useEffect, useState } from "react";
import { Home, Menu, Moon, Search, Sun, Wrench } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { CommandPalette } from "../components/CommandPalette";
import { useUiStore } from "../state/ui";
import { useToolPrefs } from "../state/toolPrefs";
import { tools } from "../tools/registry";
import { useSeo } from "../utils/seo";
import { quotes } from "../data/quotes";

export function AppLayout() {
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const location = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const tool = tools.find((t) => t.meta.path === location.pathname);
  const Icon = tool?.meta.icon;

  // 顶部名言轮播：每 10 秒切换一条，先淡出再换内容淡入
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * quotes.length));
  const [quoteVisible, setQuoteVisible] = useState(true);
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteVisible(false);
      setTimeout(() => {
        setQuoteIndex((i) => (i + 1) % quotes.length);
        setQuoteVisible(true);
      }, 400);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // 动态 SEO：每个工具页独立的 title / description / OG / JSON-LD
  const seoTitle = tool
    ? `${tool.meta.name} - 在线工具 | Toolbox`
    : "在线工具箱 | Toolbox - 免费实用的在线小工具";
  const seoDescription = tool
    ? `${tool.meta.description} 免费在线使用，无需下载安装。`
    : "Toolbox 是一个免费在线工具箱，提供 JSON 格式化、图片压缩、文档转换、二维码、正则测试、AI 文本处理等 20+ 实用工具，全部在浏览器中运行。";
  useSeo(seoTitle, seoDescription, location.pathname);

  // 深色模式：切换 <html class="dark">
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // 访问埋点：每次页面加载记录一次访问者（IP/时间/省份），失败静默忽略。
  useEffect(() => {
    fetch("/api/tools/visitor-tracker/record", { method: "POST", keepalive: true }).catch(() => {});
  }, []);

  // 记录最近使用的工具
  const pathname = location.pathname;
  useEffect(() => {
    const current = tools.find((t) => t.meta.path === pathname);
    useToolPrefs.getState().recordVisit(current?.meta.id ?? "");
  }, [pathname]);

  // Ctrl/Cmd+K 或 "/" 打开命令面板
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      } else if (e.key === "/" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
          {/* 名言轮播：中等屏幕以上显示 */}
          <div className="hidden min-w-0 flex-1 items-center justify-center px-4 md:flex">
            <p
              className={`max-w-full truncate text-sm italic text-white/90 transition-opacity duration-500 ${quoteVisible ? "opacity-100" : "opacity-0"}`}
              title={`${quotes[quoteIndex].text} —— ${quotes[quoteIndex].author}`}
            >
              "{quotes[quoteIndex].text}" <span className="text-white/70">—— {quotes[quoteIndex].author}</span>
            </p>
          </div>
          <div className="flex items-center gap-1 text-white/90">
            <button
              className="rounded-lg p-2 transition hover:bg-white/20"
              aria-label="搜索工具（Ctrl+K）"
              title="搜索工具（Ctrl+K）"
              onClick={() => setPaletteOpen(true)}
            >
              <Search size={19} />
            </button>
            <button
              className="rounded-lg p-2 transition hover:bg-white/20"
              aria-label={theme === "dark" ? "切换浅色模式" : "切换深色模式"}
              title={theme === "dark" ? "切换浅色模式" : "切换深色模式"}
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </button>
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
