import { useState } from "react";

export default function Base64Codec() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const convert = (mode: "encode" | "decode") => {
    try {
      const value = mode === "encode" ? btoa(unescape(encodeURIComponent(input))) : decodeURIComponent(escape(atob(input)));
      setOutput(value);
      setError("");
    } catch {
      setError("无法处理该内容，请确认输入的是有效的 UTF-8 文本或 Base64 字符串。");
    }
  };
  return (
    <section className="flex flex-1 flex-col gap-4 p-5 sm:p-8">
      <div className="grid flex-1 gap-4 lg:grid-cols-2">
        <div className="panel flex flex-col p-5">
          <label className="label">输入</label>
          <textarea className="field min-h-64 flex-1 font-mono" value={input} onChange={(e) => setInput(e.target.value)} />
        </div>
        <div className="panel flex flex-col p-5">
          <label className="label">结果</label>
          <textarea className="field min-h-64 flex-1 font-mono" value={output} onChange={(e) => setOutput(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-3">
        <button className="btn" onClick={() => convert("encode")}>编码</button>
        <button className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium hover:bg-slate-50" onClick={() => convert("decode")}>解码</button>
      </div>
      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
    </section>
  );
}
