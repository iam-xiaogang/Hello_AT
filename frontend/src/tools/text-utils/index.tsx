import { useMemo, useState } from "react";
import { Copy, Eraser } from "lucide-react";

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

const wordsOf = (s: string): string[] => s.trim().split(/[\s_\-]+/).filter(Boolean);

const TRANSFORMS: Record<string, (s: string) => string> = {
  "转大写": (s) => s.toUpperCase(),
  "转小写": (s) => s.toLowerCase(),
  "标题化": (s) => wordsOf(s).map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" "),
  "句首大写": (s) => s.replace(/(^\s*|[.!?。！？]\s*)([a-z])/g, (_m, p: string, c: string) => p + c.toUpperCase()),
  "camelCase": (s) => wordsOf(s).map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase())).join(""),
  "snake_case": (s) => wordsOf(s).map((w) => w.toLowerCase()).join("_"),
  "kebab-case": (s) => wordsOf(s).map((w) => w.toLowerCase()).join("-"),
  "JSON 转义": (s) => JSON.stringify(s).slice(1, -1),
  "JSON 反转义": (s) => {
    try { return JSON.parse(`"${s}"`); } catch { throw new Error("内容不是合法的 JSON 转义文本"); }
  },
  "URL 编码": (s) => encodeURIComponent(s),
  "URL 解码": (s) => {
    try { return decodeURIComponent(s); } catch { throw new Error("内容不是合法的 URL 编码文本"); }
  },
  "HTML 转义": (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"),
  "HTML 反转义": (s) => {
    const el = document.createElement("textarea");
    el.innerHTML = s;
    return el.value;
  },
  "去除首尾空白": (s) => s.trim(),
  "压缩多余空行": (s) => s.replace(/\n{3,}/g, "\n\n").replace(/^\n+|\n+$/g, ""),
  "行排序": (s) => s.split("\n").sort().join("\n"),
  "行去重": (s) => [...new Set(s.split("\n"))].join("\n"),
  "反转行序": (s) => s.split("\n").reverse().join("\n"),
};

export default function TextUtils() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    const chars = input.length;
    const noSpace = input.replace(/\s/g, "").length;
    const words = input.trim() ? input.trim().split(/\s+/).length : 0;
    const lines = input === "" ? 0 : input.split("\n").length;
    return { chars, noSpace, words, lines };
  }, [input]);

  const run = (name: string) => {
    setError("");
    try {
      setOutput(TRANSFORMS[name](input));
    } catch (e) {
      setError(e instanceof Error ? e.message : "处理失败。");
    }
  };

  return (
    <section className="flex flex-1 flex-col gap-4 p-5 sm:p-8">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div>
            <label className="label" htmlFor="tu-input">输入文本</label>
            <textarea
              id="tu-input"
              className="field min-h-52 font-mono text-[13px]"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="粘贴要处理的文本……"
            />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-xl bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
            <span>字符（含空格）<b className="font-mono text-slate-700">{stats.chars}</b></span>
            <span>字符（不含空格）<b className="font-mono text-slate-700">{stats.noSpace}</b></span>
            <span>单词 <b className="font-mono text-slate-700">{stats.words}</b></span>
            <span>行数 <b className="font-mono text-slate-700">{stats.lines}</b></span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="label mb-0" htmlFor="tu-output">处理结果</label>
            <div className="flex gap-2">
              <button
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:border-emerald-300 hover:text-emerald-600"
                onClick={async () => {
                  if (await copy(output)) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1200);
                  }
                }}
              >
                {copied ? <span className="text-emerald-600">已复制 ✓</span> : <><Copy size={13} />复制</>}
              </button>
              <button
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:text-rose-600"
                onClick={() => { setOutput(""); setError(""); }}
              >
                <Eraser size={13} />清空
              </button>
            </div>
          </div>
          <textarea
            id="tu-output"
            className="field min-h-52 font-mono text-[13px]"
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            placeholder="处理后结果将显示在这里（可编辑）"
          />
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}

      <div className="panel flex flex-col gap-3 p-5">
        <p className="label mb-0">操作</p>
        <div className="flex flex-wrap gap-2">
          {Object.keys(TRANSFORMS).map((name) => (
            <button
              key={name}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
              onClick={() => run(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
