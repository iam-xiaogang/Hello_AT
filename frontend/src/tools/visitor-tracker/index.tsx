import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { MapPin, RefreshCw, Users } from "lucide-react";
import { apiFetch } from "../../api/client";
import { ChinaMap } from "./ChinaMap";

interface Visitor {
  ip: string;
  country: string;
  province: string;
  city: string;
  isp: string;
  visited_at: string;
}

interface ProvinceStat {
  province: string;
  visitors: number;
  visits: number;
}

interface Summary {
  total_visits: number;
  unique_ips: number;
  china_visits: number;
  china_unique: number;
  provinces: ProvinceStat[];
}

async function getJson<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  return (await res.json()) as T;
}

function StatCard({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string; hint: string }) {
  const full = `${label} · ${hint}`;
  return (
    <div
      className="group relative flex items-center gap-3 rounded-xl border border-slate-100 bg-white/70 px-4 py-3"
      title={full}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-sm">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-tight text-slate-800">{value}</p>
        <p className="truncate text-xs text-slate-500">{full}</p>
      </div>
      {/* 悬停气泡：显示完整内容 */}
      <div className="pointer-events-none invisible absolute left-1/2 top-0 z-20 w-max max-w-[260px] -translate-x-1/2 -translate-y-[calc(100%+6px)] rounded-lg bg-slate-800 px-3 py-2 text-left text-xs leading-relaxed text-white opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
        <p className="font-semibold">{value}</p>
        <p>{full}</p>
      </div>
    </div>
  );
}

export default function VisitorTracker() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [listRes, summaryRes] = await Promise.all([
        getJson<{ visitors: Visitor[] }>("/tools/visitor-tracker/list"),
        getJson<Summary>("/tools/visitor-tracker/summary"),
      ]);
      setVisitors(listRes.visitors);
      setSummary(summaryRes);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="flex flex-1 flex-col gap-4 p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">中国大陆访问者</h2>
          <p className="text-sm text-slate-500">按 IP 去重显示最近访问，每 30 秒自动刷新。</p>
        </div>
        <button className="btn" onClick={load} disabled={loading}>
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          刷新
        </button>
      </div>

      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}

      <div className="panel flex flex-col gap-3 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="label mb-0">省份分布（中国地图）</p>
          <p className="text-xs text-slate-400">有色省份 = 有访问记录（各省颜色不同），白色 = 暂无访问；可拖动/缩放</p>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="flex shrink-0 flex-col gap-3 lg:w-52 lg:pt-1">
            <StatCard
              icon={<Users size={17} />}
              label="中国大陆访问者"
              value={String(summary?.china_unique ?? "–")}
              hint={`共 ${summary?.china_visits ?? "–"} 次`}
            />
            <StatCard
              icon={<MapPin size={17} />}
              label="覆盖省份"
              value={String(summary?.provinces.length ?? "–")}
              hint="仅统计中国大陆"
            />
            <StatCard
              icon={<RefreshCw size={17} />}
              label="全部访问"
              value={String(summary?.total_visits ?? "–")}
              hint={`去重 IP ${summary?.unique_ips ?? "–"} 个`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <ChinaMap provinces={summary?.provinces ?? []} />
          </div>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">访问时间（北京时间）</th>
                <th className="px-5 py-3 font-medium">IP 地址</th>
                <th className="px-5 py-3 font-medium">省份</th>
                <th className="px-5 py-3 font-medium">城市</th>
                <th className="px-5 py-3 font-medium">运营商</th>
              </tr>
            </thead>
            <tbody>
              {visitors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    {loading ? "加载中……" : "暂无中国大陆访问记录"}
                  </td>
                </tr>
              ) : (
                visitors.map((v) => (
                  <tr key={`${v.ip}-${v.visited_at}`} className="border-b border-slate-50 last:border-0 hover:bg-orange-50/40">
                    <td className="whitespace-nowrap px-5 py-3 text-slate-600">{v.visited_at}</td>
                    <td className="px-5 py-3 font-mono text-[13px] text-slate-800">{v.ip}</td>
                    <td className="px-5 py-3 font-medium text-slate-700">{v.province || "–"}</td>
                    <td className="px-5 py-3 text-slate-600">{v.city || "–"}</td>
                    <td className="px-5 py-3 text-slate-500">{v.isp || "–"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
