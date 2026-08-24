import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { meta } from "./meta";

export default function EnglishLearning() {
  const [frameKey, setFrameKey] = useState(0);
  return (
    <section className="relative flex min-h-0 flex-1 flex-col">
      <button
        className="absolute right-4 top-4 z-10 rounded-lg border border-slate-300 bg-white p-2.5 text-slate-600 shadow-sm hover:bg-slate-50"
        onClick={() => setFrameKey((k) => k + 1)}
        aria-label="刷新页面"
        title="刷新页面"
      >
        <RefreshCw size={17} />
      </button>
      <div className="panel flex min-h-0 flex-1 overflow-hidden bg-white">
        <iframe
          key={frameKey}
          title="AI English Teacher"
          src={meta.externalUrl}
          className="h-full w-full border-0"
        />
      </div>
    </section>
  );
}
