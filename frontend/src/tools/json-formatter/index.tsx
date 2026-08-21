import { useState } from "react";

export default function JsonFormatter() {
  const [value, setValue] = useState('{\n  "hello": "world"\n}');
  const [error, setError] = useState("");
  const format = (space?: number) => {
    try { setValue(JSON.stringify(JSON.parse(value), null, space)); setError(""); }
    catch { setError("JSON 格式不正确，请检查括号、逗号和引号。"); }
  };
  return <section className="space-y-5"><div><h1 className="text-2xl font-semibold">JSON 格式化 / 校验</h1><p className="mt-1 text-sm text-slate-500">所有处理都在浏览器本地完成。</p></div><div className="panel p-5"><label className="label" htmlFor="json-input">JSON 内容</label><textarea id="json-input" className="field min-h-80 font-mono leading-6" value={value} onChange={(e) => setValue(e.target.value)} spellCheck={false}/><div className="mt-4 flex flex-wrap gap-3"><button className="btn" onClick={() => format(2)}>格式化并校验</button><button className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium hover:bg-slate-50" onClick={() => format()}>压缩</button></div>{error && <p role="alert" className="mt-3 text-sm text-rose-600">{error}</p>}</div></section>;
}
