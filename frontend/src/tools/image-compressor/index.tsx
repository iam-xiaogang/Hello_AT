import { useState } from "react";
import { Download, Upload } from "lucide-react";
import { ApiError, apiFetch } from "../../api/client";

function getDownloadName(disposition: string): string {
  // Prefer RFC 5987's UTF-8 name, then gracefully fall back to ASCII filename.
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
  if (encoded) {
    try { return decodeURIComponent(encoded); } catch { /* fall through */ }
  }
  return /filename="?([^";]+)"?/i.exec(disposition)?.[1] ?? "compressed-image";
}

export default function ImageCompressor() {
  const [file, setFile] = useState<File | null>(null); const [quality, setQuality] = useState(80); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [download, setDownload] = useState<{ url: string; name: string } | null>(null);
  const submit = async () => { if (!file) { setError("请先选择一张图片。"); return; } setBusy(true); setError(""); if (download) URL.revokeObjectURL(download.url); setDownload(null); try { const form = new FormData(); form.append("file", file); form.append("quality", String(quality)); const res = await apiFetch("/tools/image-compressor/compress", { method: "POST", body: form }); const blob = await res.blob(); const name = getDownloadName(res.headers.get("Content-Disposition") ?? ""); setDownload({ url: URL.createObjectURL(blob), name }); } catch (e) { setError(e instanceof ApiError ? e.message : "图片压缩失败。"); } finally { setBusy(false); } };
  return <section className="space-y-5"><div><h1 className="text-2xl font-semibold">图片压缩</h1><p className="mt-1 text-sm text-slate-500">支持 JPEG、PNG、WebP，单个文件最大 12 MB。</p></div><div className="panel max-w-2xl p-5"><label className="label" htmlFor="image-file">选择图片</label><input id="image-file" className="field" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setDownload(null); }} /><p className="mt-2 text-sm text-slate-500">{file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB` : "尚未选择文件"}</p><label className="label mt-5" htmlFor="quality">压缩质量：{quality}</label><input id="quality" className="w-full accent-indigo-600" type="range" min="1" max="95" value={quality} onChange={(e) => setQuality(Number(e.target.value))}/><div className="mt-6 flex flex-wrap gap-3"><button className="btn" disabled={busy} onClick={submit}><Upload size={17}/>{busy ? "正在压缩…" : "开始压缩"}</button>{download && <a className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700" href={download.url} download={download.name}><Download size={17}/>下载压缩图片</a>}</div>{error && <p role="alert" className="mt-3 text-sm text-rose-600">{error}</p>}</div></section>;
}
