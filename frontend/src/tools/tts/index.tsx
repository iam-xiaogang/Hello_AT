import { useEffect, useState } from "react";
import { Loader2, Pause, Play, Square, Volume2 } from "lucide-react";
import { getParam } from "../../utils/params";

type Status = "idle" | "speaking" | "paused";

const RATE_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function Tts() {
  const [text, setText] = useState(getParam("text"));
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [status, setStatus] = useState<Status>("idle");
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      setUnsupported(true);
      return;
    }
    const load = () => {
      const list = window.speechSynthesis.getVoices();
      setVoices(list);
      if (!voiceURI) {
        const zh = list.find((v) => v.lang.toLowerCase().startsWith("zh")) ?? list[0];
        if (zh) setVoiceURI(zh.voiceURI);
      }
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedVoice = voices.find((v) => v.voiceURI === voiceURI);

  const speak = () => {
    if (!text.trim() || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = "zh-CN";
    }
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.onstart = () => setStatus("speaking");
    utterance.onend = () => setStatus("idle");
    utterance.onerror = () => setStatus("idle");
    window.speechSynthesis.speak(utterance);
  };

  const togglePause = () => {
    if (!("speechSynthesis" in window)) return;
    if (status === "speaking") {
      window.speechSynthesis.pause();
      setStatus("paused");
    } else if (status === "paused") {
      window.speechSynthesis.resume();
      setStatus("speaking");
    }
  };

  const stop = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setStatus("idle");
  };

  if (unsupported) {
    return (
      <section className="flex flex-1 flex-col gap-4 p-5 sm:p-8">
        <div className="panel p-5">
          <p role="alert" className="text-sm text-rose-600">当前浏览器不支持语音合成（Web Speech API），请使用 Chrome / Edge / Safari 等现代浏览器。</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col gap-4 p-5 sm:p-8">
      <div className="panel flex flex-col gap-4 p-5">
        <div>
          <label className="label" htmlFor="tts-text">要朗读的文本</label>
          <textarea
            id="tts-text"
            className="field min-h-40 font-mono text-[13px]"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="输入或粘贴要朗读的文本……"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="tts-voice">语音</label>
            <select id="tts-voice" className="field" value={voiceURI} onChange={(e) => setVoiceURI(e.target.value)}>
              {voices.length === 0 && <option value="">语音加载中……</option>}
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name}（{v.lang}）
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="tts-rate">语速 {rate.toFixed(2)}×</label>
            <input id="tts-rate" className="w-full accent-teal-600" type="range" min={0.5} max={2} step={0.05} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
            <div className="mt-1 flex gap-1">
              {RATE_PRESETS.map((r) => (
                <button
                  key={r}
                  className={`rounded-md border px-2 py-0.5 text-xs ${rate === r ? "border-teal-400 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                  onClick={() => setRate(r)}
                >
                  {r}×
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="tts-pitch">音调 {pitch.toFixed(2)}</label>
            <input id="tts-pitch" className="w-full accent-teal-600" type="range" min={0.5} max={2} step={0.05} value={pitch} onChange={(e) => setPitch(Number(e.target.value))} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button className="btn !from-teal-500 !via-emerald-500 !to-green-400" onClick={speak} disabled={!text.trim()}>
            {status === "speaking" ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {status === "speaking" ? "朗读中…" : "开始朗读"}
          </button>
          <button
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            onClick={togglePause}
            disabled={status === "idle"}
          >
            <Pause size={15} className="mr-1.5 inline" />
            {status === "paused" ? "继续" : "暂停"}
          </button>
          <button
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-600 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
            onClick={stop}
            disabled={status === "idle"}
          >
            <Square size={14} className="mr-1.5 inline" />
            停止
          </button>
          {selectedVoice && (
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-slate-400">
              <Volume2 size={14} />
              {selectedVoice.name}（{selectedVoice.lang}）
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400">
          语音由浏览器本地合成（Web Speech API），不经过服务器、完全免费；可用语音列表取决于操作系统与浏览器。
        </p>
      </div>
    </section>
  );
}
