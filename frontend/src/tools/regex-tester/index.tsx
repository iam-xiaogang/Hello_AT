import { useMemo, useState } from "react";
import { Copy, SearchCheck } from "lucide-react";
import { getParam } from "../../utils/params";

interface MatchInfo {
  index: number;
  full: string;
  groups: string[];
  named: Record<string, string>;
}

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

const FLAGS = [
  { id: "g", label: "g 全局" },
  { id: "i", label: "i 忽略大小写" },
  { id: "m", label: "m 多行" },
  { id: "s", label: "s 点匹配换行" },
  { id: "u", label: "u Unicode" },
] as const;

export default function RegexTester() {
  const [pattern, setPattern] = useState(getParam("pattern"));
  const [text, setText] = useState(getParam("text"));
  const [flags, setFlags] = useState("gi");

  const { error, matches, segments } = useMemo(() => {
    const out = { error: "", matches: [] as MatchInfo[], segments: [] as { text: string; isMatch: boolean }[] };
    if (!pattern) return out;
    let re: RegExp;
    try {
      re = new RegExp(pattern, flags);
    } catch (e) {
      out.error = e instanceof Error ? e.message : "正则表达式无效";
      return out;
    }

    // 匹配列表（保持用户给定的 flags；无 g 时只取第一个）
    const list: MatchInfo[] = [];
    const iterable = flags.includes("g") ? re : new RegExp(pattern, flags + "g");
    let m: RegExpExecArray | null;
    let guard = 0;
    while ((m = iterable.exec(text)) !== null) {
      if (guard++ > 100000) break;
      const groups: string[] = [];
      for (let i = 1; i < m.length; i++) groups.push(m[i] ?? "");
      const named: Record<string, string> = {};
      if (m.groups) {
        for (const [k, v] of Object.entries(m.groups)) named[k] = v ?? "";
      }
      list.push({ index: m.index, full: m[0], groups, named });
      if (!flags.includes("g")) break;
      if (m[0] === "" && iterable.lastIndex === m.index) iterable.lastIndex++;
    }
    out.matches = list;

    // 高亮分段
    const segs: { text: string; isMatch: boolean }[] = [];
    const hi = flags.includes("g") ? re : new RegExp(pattern, flags + "g");
    let last = 0;
    let mm: RegExpExecArray | null;
    let g = 0;
    while ((mm = hi.exec(text)) !== null) {
      if (g++ > 100000) break;
      if (mm.index > last) segs.push({ text: text.slice(last, mm.index), isMatch: false });
      segs.push({ text: mm[0], isMatch: true });
      last = hi.lastIndex;
      if (mm[0] === "" && hi.lastIndex === mm.index) hi.lastIndex++;
    }
    if (last < text.length) segs.push({ text: text.slice(last), isMatch: false });
    out.segments = segs;
    return out;
  }, [pattern, text, flags]);

  const toggleFlag = (id: string) => {
    setFlags((f) => (f.includes(id) ? f.replace(id, "") : f + id));
  };

  return (
    <section className="flex flex-1 flex-col gap-4 p-5 sm:p-8">
      <div className="panel flex flex-col gap-4 p-5">
        <div>
          <label className="label" htmlFor="re-pattern">正则表达式</label>
          <input
            id="re-pattern"
            className="field font-mono"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="例如：\d{4}-\d{2}-\d{2} 或 ([a-z]+)@([a-z.]+)"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FLAGS.map((f) => (
            <button
              key={f.id}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${flags.includes(f.id) ? "border-fuchsia-400 bg-fuchsia-50 text-fuchsia-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
              onClick={() => toggleFlag(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div>
          <label className="label" htmlFor="re-text">测试文本</label>
          <textarea
            id="re-text"
            className="field min-h-36 font-mono text-[13px]"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="粘贴要匹配的文本……"
          />
        </div>
        {error && <p role="alert" className="text-sm text-rose-600">正则错误：{error}</p>}
      </div>

      <div className="panel flex flex-col gap-3 p-5">
        <p className="label mb-0 flex items-center gap-1.5">
          <SearchCheck size={16} />
          匹配结果（{matches.length} 处）
        </p>
        {text && !error && (
          <div className="max-h-64 overflow-y-auto whitespace-pre-wrap break-all rounded-xl border border-slate-100 bg-white p-4 text-sm leading-relaxed text-slate-700">
            {segments.length === 0 ? (
              <span className="text-slate-400">无匹配</span>
            ) : (
              segments.map((s, i) =>
                s.isMatch ? (
                  <mark key={i} className="rounded bg-amber-200 px-0.5 text-slate-900">{s.text}</mark>
                ) : (
                  <span key={i}>{s.text}</span>
                ),
              )
            )}
          </div>
        )}
        {matches.length > 0 && (
          <div className="flex flex-col gap-2">
            {matches.slice(0, 100).map((m, i) => (
              <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-slate-400">第 {i + 1} 处 · 位置 {m.index}</span>
                  <button
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-0.5 text-xs text-slate-500 hover:text-fuchsia-600"
                    onClick={async () => { await copy(m.full); }}
                  >
                    <Copy size={12} />复制
                  </button>
                </div>
                <code className="break-all font-mono text-[13px] text-fuchsia-700">{m.full}</code>
                {m.groups.some((g) => g !== "") && (
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                    {m.groups.map((g, gi) => (
                      <span key={gi}><b className="text-slate-400">${gi + 1}</b> {g || "—"}</span>
                    ))}
                  </div>
                )}
                {Object.keys(m.named).length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                    {Object.entries(m.named).map(([k, v]) => (
                      <span key={k}><b className="text-slate-400">?&lt;{k}&gt;</b> {v || "—"}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {matches.length > 100 && <p className="text-xs text-slate-400">仅显示前 100 条，共 {matches.length} 条</p>}
          </div>
        )}
      </div>
    </section>
  );
}
