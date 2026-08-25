import { useState } from "react";
import { Download, Upload } from "lucide-react";
import { ApiError, apiFetch } from "../../api/client";

interface TargetOption {
  id: "pdf-to-word" | "pdf-to-text" | "word-to-text";
  label: string;
  hint: string;
  accept: string;
}

const TARGETS: TargetOption[] = [
  { id: "pdf-to-word", label: "PDF → Word", hint: "保留排版，转换为可编辑的 .docx", accept: "application/pdf,.pdf" },
  { id: "pdf-to-text", label: "PDF → 文本", hint: "提取 PDF 文字内容为 .txt", accept: "application/pdf,.pdf" },
  { id: "word-to-text", label: "Word → 文本", hint: "提取 Word 文档文字为 .txt", accept: ".docx" },
];

function getDownloadName(disposition: string): string {
  // Prefer RFC 5987's UTF-8 name, then gracefully fall back to ASCII filename.
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
  if (encoded) {
    try { return decodeURIComponent(encoded); } catch { /* fall through */ }
  }
  return /filename="?([^";]+)"?/i.exec(disposition)?.[1] ?? "converted";
}

export default function DocConverter() {
  const [target, setTarget] = useState(TARGETS[0]);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [download, setDownload] = useState<{ url: string; name: string } | null>(null);

  const selectTarget = (option: TargetOption) => {
    setTarget(option);
    setFile(null);
    if (download) URL.revokeObjectURL(download.url);
    setDownload(null);
  };

  const submit = async () => {
    if (!file) {
      setError("请先选择文件。");
      return;
    }
    setBusy(true);
    setError("");
    if (download) URL.revokeObjectURL(download.url);
    setDownload(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("target", target.id);
      const res = await apiFetch("/tools/doc-converter/convert", { method: "POST", body: form });
      const blob = await res.blob();
      const name = getDownloadName(res.headers.get("Content-Disposition") ?? "");
      setDownload({ url: URL.createObjectURL(blob), name });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "转换失败。");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="flex flex-1 flex-col gap-4 p-5 sm:p-8">
      <div className="panel flex flex-col gap-4 p-5">
        <div>
          <p className="label">转换方式</p>
          <div className="flex flex-wrap gap-2">
            {TARGETS.map((option) => (
              <button
                key={option.id}
                className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${target.id === option.id ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}
                onClick={() => selectTarget(option)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-slate-500">{target.hint}</p>
        </div>
        <div>
          <label className="label" htmlFor="doc-file">选择文件</label>
          <input
            id="doc-file"
            className="field"
            type="file"
            accept={target.accept}
            onChange={(e) => { setFile(e.target.files?.[0] ?? null); setDownload(null); }}
          />
          <p className="mt-2 text-sm text-slate-500">
            {file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB` : "尚未选择文件"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="btn" disabled={busy} onClick={submit}>
            <Upload size={17} />{busy ? "正在转换…" : "开始转换"}
          </button>
          {download && (
            <a
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700"
              href={download.url}
              download={download.name}
            >
              <Download size={17} />下载转换结果
            </a>
          )}
        </div>
        {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
      </div>
    </section>
  );
}
