import { useState } from "react";
import { Clock, Copy, RefreshCw } from "lucide-react";

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function formatDate(d: Date, tz: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
}

function relative(d: Date): string {
  const diffSec = Math.round((d.getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return diffSec >= 0 ? "刚刚" : "刚刚";
  if (abs < 3600) return `${Math.floor(abs / 60)} 分钟${diffSec >= 0 ? "后" : "前"}`;
  if (abs < 86400) return `${Math.floor(abs / 3600)} 小时${diffSec >= 0 ? "后" : "前"}`;
  if (abs < 86400 * 30) return `${Math.floor(abs / 86400)} 天${diffSec >= 0 ? "后" : "前"}`;
  return d.toLocaleDateString("zh-CN");
}

interface Parsed {
  seconds: number;
  ms: number;
}

function parseTimestamp(input: string): Parsed | null {
  const raw = input.trim();
  if (!/^\d{1,16}$/.test(raw)) return null;
  const num = Number(raw);
  if (raw.length <= 10) return { seconds: num, ms: num * 1000 };
  return { seconds: Math.floor(num / 1000), ms: num };
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
      onClick={async () => {
        if (await copy(value)) {
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        }
      }}
    >
      {done ? <span className="text-emerald-600">已复制 ✓</span> : <><Copy size={13} />{label}</>}
    </button>
  );
}

export default function TimestampTool() {
  const [tsInput, setTsInput] = useState("");
  const [now, setNow] = useState<Date>(new Date());
  const [datetime, setDatetime] = useState("");

  const parsed = parseTimestamp(tsInput);
  const parsedDate = parsed ? new Date(parsed.ms) : null;
  const dateValue = datetime ? new Date(datetime) : null;
  const dateSeconds = dateValue && !Number.isNaN(dateValue.getTime()) ? Math.floor(dateValue.getTime() / 1000) : null;

  return (
    <section className="flex flex-1 flex-col gap-4 p-5 sm:p-8">
      <div className="panel flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-64 flex-1">
            <label className="label" htmlFor="ts-input">时间戳 → 日期时间（自动识别秒/毫秒）</label>
            <input
              id="ts-input"
              className="field font-mono"
              value={tsInput}
              onChange={(e) => setTsInput(e.target.value)}
              placeholder="例如 1756483200 或 1756483200000"
            />
          </div>
          <button
            className="btn"
            onClick={() => {
              const n = new Date();
              setNow(n);
              setTsInput(String(Math.floor(n.getTime() / 1000)));
            }}
          >
            <RefreshCw size={16} />
            填入当前时间戳
          </button>
        </div>

        {tsInput.trim() === "" && (
          <p className="text-sm text-slate-400">当前时间：{formatDate(now, "Asia/Shanghai")}（北京时间）</p>
        )}

        {parsed && parsedDate && (
          <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-24 shrink-0 text-slate-500">秒级时间戳</span>
              <code className="flex-1 break-all font-mono text-slate-800">{parsed.seconds}</code>
              <CopyButton value={String(parsed.seconds)} label="复制" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-24 shrink-0 text-slate-500">毫秒级时间戳</span>
              <code className="flex-1 break-all font-mono text-slate-800">{parsed.ms}</code>
              <CopyButton value={String(parsed.ms)} label="复制" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-24 shrink-0 text-slate-500">北京时间</span>
              <code className="flex-1 font-mono text-slate-800">{formatDate(parsedDate, "Asia/Shanghai")}</code>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-24 shrink-0 text-slate-500">UTC 时间</span>
              <code className="flex-1 font-mono text-slate-800">{formatDate(parsedDate, "UTC")}</code>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-24 shrink-0 text-slate-500">ISO 8601</span>
              <code className="flex-1 break-all font-mono text-slate-800">{parsedDate.toISOString()}</code>
              <CopyButton value={parsedDate.toISOString()} label="复制" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-24 shrink-0 text-slate-500">相对时间</span>
              <code className="flex-1 font-mono text-slate-800">{relative(parsedDate)}</code>
            </div>
          </div>
        )}
      </div>

      <div className="panel flex flex-col gap-4 p-5">
        <div className="min-w-64 flex-1">
          <label className="label" htmlFor="ts-datetime">日期时间 → 时间戳（选择本地时间）</label>
          <input
            id="ts-datetime"
            className="field"
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
          />
        </div>
        {dateSeconds !== null && (
          <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-24 shrink-0 text-slate-500">秒级时间戳</span>
              <code className="flex-1 font-mono text-slate-800">{dateSeconds}</code>
              <CopyButton value={String(dateSeconds)} label="复制" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-24 shrink-0 text-slate-500">毫秒级时间戳</span>
              <code className="flex-1 font-mono text-slate-800">{dateValue ? dateValue.getTime() : ""}</code>
              <CopyButton value={dateValue ? String(dateValue.getTime()) : ""} label="复制" />
            </div>
          </div>
        )}
        <p className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock size={13} />
          提示：秒级 10 位数字、毫秒级 13 位数字，输入时自动识别。
        </p>
      </div>
    </section>
  );
}
