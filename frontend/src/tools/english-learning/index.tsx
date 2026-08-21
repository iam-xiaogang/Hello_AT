import { ExternalLink, RefreshCw } from "lucide-react";

// The default is a same-origin Vite proxy to Streamlit. A public deployment
// can override it without changing the tool source.
const englishLearningUrl = import.meta.env.VITE_ENGLISH_LEARNING_URL || "/english-learning/";

export default function EnglishLearning() {
  return (
    <section className="flex min-h-[calc(100vh-8.5rem)] flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">英语学习</h1>
          <p className="mt-1 text-sm text-slate-500">AI 英语老师：对话、口语、语法纠错、翻译与商务英语。</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-slate-300 p-2.5 text-slate-600 hover:bg-slate-50" onClick={() => window.location.reload()} aria-label="刷新页面">
            <RefreshCw size={17} />
          </button>
          <a className="btn" href={englishLearningUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={17} />独立打开
          </a>
        </div>
      </div>

      <div className="panel min-h-[780px] flex-1 overflow-hidden bg-white">
        <iframe title="AI English Teacher" src={englishLearningUrl} className="h-full min-h-[780px] w-full border-0" />
      </div>

      <p className="text-xs text-slate-400">
        若页面未出现，请按 README 中的命令以 <code>/english-learning</code> 路径启动 Streamlit 服务。
      </p>
    </section>
  );
}
