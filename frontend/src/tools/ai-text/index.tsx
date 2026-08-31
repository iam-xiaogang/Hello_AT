import { useState } from "react";
import { CheckCircle2, Copy, Languages, Loader2, PenLine, Sparkles, SpellCheck2, ListOrdered } from "lucide-react";
import { apiFetch } from "../../api/client";

type Action = "translate" | "polish" | "summarize" | "proofread";

interface ActionButton {
  id: Action;
  label: string;
  icon: React.ReactNode;
  target: string;
}

const ACTIONS: ActionButton[] = [
  { id: "translate", label: "翻译成中文", icon: <Languages size={16} />, target: "中文" },
  { id: "translate", label: "翻译成英文", icon: <Languages size={16} />, target: "英文" },
  { id: "polish", label: "润色", icon: <PenLine size={16} />, target: "中文" },
  { id: "summarize", label: "总结要点", icon: <ListOrdered size={16} />, target: "中文" },
  { id: "proofread", label: "纠错", icon: <SpellCheck2 size={16} />, target: "中文" },
];

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function AiText() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const run = async (action: Action, target: string) => {
    if (!text.trim()) {
      setError("请先输入文本。");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      // 可选：构建时配置 VITE_AI_API_TOKEN 后自动携带访问令牌
      const token = import.meta.env.VITE_AI_API_TOKEN as string | undefined;
      if (token) headers["X-Api-Token"] = token;
      const res = await apiFetch("/tools/ai-text/process", {
        method: "POST",
        headers,
        body: JSON.stringify({ action, text, target }),
      });
      const data = (await res.json()) as { result: string };
      setResult(data.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "处理失败。");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="flex flex-1 flex-col gap-4 p-5 sm:p-8">
      <div className="panel flex flex-col gap-4 p-5">
        <div>
          <label className="label" htmlFor="ai-text-input">输入文本</label>
          <textarea
            id="ai-text-input"
            className="field min-h-44 font-mono text-[13px]"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="粘贴要翻译、润色、总结或纠错的文本……"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {ACTIONS.map((a, i) => (
            <button
              key={`${a.label}-${i}`}
              className="btn !from-purple-500 !via-indigo-500 !to-sky-400"
              onClick={() => run(a.id, a.target)}
              disabled={busy}
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : a.icon}
              {a.label}
            </button>
          ))}
        </div>
        {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
      </div>

      <div className="panel flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <p className="label mb-0 flex items-center gap-1.5">
            <Sparkles size={16} />
            AI 输出
          </p>
          {result && (
            <button
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:border-purple-300 hover:text-purple-600"
              onClick={async () => {
                if (await copy(result)) {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                }
              }}
            >
              {copied ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Copy size={13} />}
              {copied ? "已复制" : "复制"}
            </button>
          )}
        </div>
        <div className="min-h-40 whitespace-pre-wrap break-words rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
          {busy ? (
            <span className="flex items-center gap-2 text-slate-400">
              <Loader2 size={16} className="animate-spin" /> AI 思考中……
            </span>
          ) : result ? (
            result
          ) : (
            <span className="text-slate-400">输出将显示在这里</span>
          )}
        </div>
        <p className="text-xs text-slate-400">
          由 DeepSeek 等大模型生成，密钥保存在服务器端；首次使用前需在 backend/.env 配置 TOOLBOX_AI_API_KEY。
        </p>
      </div>
    </section>
  );
}
