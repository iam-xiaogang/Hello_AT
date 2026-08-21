import { ExternalLink, RefreshCw } from "lucide-react";

// Vite proxies this path to the separately maintained Flask service. Keeping
// it same-origin avoids iframe restrictions and preserves its /api/lookup API.
const newsDashboardUrl = import.meta.env.VITE_DAILY_NEWS_URL || "/news-agent/";
export default function DailyNews() {
  return (
    <section className="flex min-h-[calc(100vh-8.5rem)] flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Daily News</h1>
          <p className="mt-1 text-sm text-slate-500">每日国内国际新闻看板</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-slate-300 p-2.5 text-slate-600 hover:bg-slate-50" onClick={() => window.location.reload()} aria-label="刷新页面">
            <RefreshCw size={17} />
          </button>
          <a className="btn" href={newsDashboardUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={17} />独立打开
          </a>
        </div>
      </div>

      <div className="panel min-h-[720px] flex-1 overflow-hidden bg-white">
        <iframe title="Daily News dashboard" src={newsDashboardUrl} className="h-full min-h-[720px] w-full border-0" allow="clipboard-read; clipboard-write" />
      </div>

      {/* <p className="text-xs text-slate-400">若看板未出现，请先在 news_agent 目录启动网页服务：<code>python main.py --serve</code>。</p> */}
    </section>
  );
}
