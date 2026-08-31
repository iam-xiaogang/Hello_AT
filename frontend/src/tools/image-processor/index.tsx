import { useEffect, useRef, useState } from "react";
import { Download, FileArchive, Images, Loader2, Upload } from "lucide-react";
import JSZip from "jszip";

interface Options {
  format: "original" | "image/jpeg" | "image/png" | "image/webp";
  sizeMode: "original" | "width" | "percent";
  width: number;
  percent: number;
  radius: number;
  watermark: string;
  watermarkSize: number;
  watermarkOpacity: number;
  watermarkPos: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  quality: number;
}

interface ProcessedImage {
  name: string;
  url: string;
  size: number;
}

const DEFAULT_OPTS: Options = {
  format: "original",
  sizeMode: "original",
  width: 800,
  percent: 50,
  radius: 0,
  watermark: "",
  watermarkSize: 8,
  watermarkOpacity: 0.5,
  watermarkPos: "bottom-right",
  quality: 85,
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const POSITIONS: Record<Options["watermarkPos"], [number, number]> = {
  "top-left": [0.1, 1.2],
  "top-right": [0.9, 1.2],
  "bottom-left": [0.1, -1.2],
  "bottom-right": [0.9, -1.2],
  center: [0.5, 0],
};

async function processOne(file: File, opts: Options): Promise<ProcessedImage> {
  const bitmap = await createImageBitmap(file);
  let w = bitmap.width;
  let h = bitmap.height;
  if (opts.sizeMode === "width" && bitmap.width > 0) {
    const scale = opts.width / bitmap.width;
    w = Math.max(1, Math.round(bitmap.width * scale));
    h = Math.max(1, Math.round(bitmap.height * scale));
  } else if (opts.sizeMode === "percent") {
    const scale = opts.percent / 100;
    w = Math.max(1, Math.round(bitmap.width * scale));
    h = Math.max(1, Math.round(bitmap.height * scale));
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("浏览器不支持 Canvas 处理。");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  if (opts.radius > 0) {
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, 0, 0, w, h, (opts.radius / 100) * Math.min(w, h));
    ctx.clip();
    ctx.drawImage(bitmap, 0, 0, w, h);
    ctx.restore();
  } else {
    ctx.drawImage(bitmap, 0, 0, w, h);
  }

  if (opts.watermark.trim()) {
    const size = Math.max(12, Math.round((opts.watermarkSize / 100) * Math.min(w, h)));
    ctx.font = `${size}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const [px, py] = POSITIONS[opts.watermarkPos];
    const x = w * px;
    const y = py > 0 ? size * py : py < 0 ? h + size * py : h / 2;
    ctx.lineWidth = Math.max(1, size / 10);
    ctx.strokeStyle = `rgba(0, 0, 0, ${opts.watermarkOpacity * 0.6})`;
    ctx.fillStyle = `rgba(255, 255, 255, ${opts.watermarkOpacity})`;
    ctx.strokeText(opts.watermark, x, y);
    ctx.fillText(opts.watermark, x, y);
  }

  const mime = opts.format === "original" ? (file.type || "image/jpeg") : opts.format;
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("图片处理失败。"))), mime, opts.quality / 100);
  });
  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  const name = file.name.replace(/\.[^.]+$/, "") + "-processed." + ext;
  return { name, url: URL.createObjectURL(blob), size: blob.size };
}

function triggerDownload(url: string, name: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function ImageProcessor() {
  const [files, setFiles] = useState<File[]>([]);
  const [opts, setOpts] = useState<Options>(DEFAULT_OPTS);
  const [results, setResults] = useState<ProcessedImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickFiles = (list: File[] | FileList | null) => {
    const imgs = Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));
    if (imgs.length > 0) {
      setFiles(imgs);
      setResults([]);
      setError("");
    }
  };

  // 支持 Ctrl+V 粘贴图片
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const f = e.clipboardData?.files?.[0];
      if (f && f.type.startsWith("image/")) pickFiles([f]);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  const patch = (p: Partial<Options>) => setOpts((o) => ({ ...o, ...p }));

  const process = async () => {
    if (files.length === 0) {
      setError("请先选择图片。");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const out: ProcessedImage[] = [];
      for (const f of files) out.push(await processOne(f, opts));
      setResults(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : "处理失败。");
    } finally {
      setBusy(false);
    }
  };

  const downloadAll = async () => {
    if (results.length === 0) return;
    const zip = new JSZip();
    for (const r of results) {
      const blob = await fetch(r.url).then((res) => res.blob());
      zip.file(r.name, blob);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    triggerDownload(URL.createObjectURL(blob), "processed-images.zip");
  };

  return (
    <section className="flex flex-1 flex-col gap-4 p-5 sm:p-8">
      <div
        className={`panel flex flex-col gap-4 p-5 transition ${dragging ? "border-2 border-dashed border-sky-400" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pickFiles(e.dataTransfer.files);
        }}
      >
        <div>
          <label className="label" htmlFor="img-multi">选择图片（可多选）</label>
          <input
            id="img-multi"
            ref={fileRef}
            className="field"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              pickFiles(e.target.files);
            }}
          />
          {files.length > 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              已选择 {files.length} 张：{files.slice(0, 5).map((f) => f.name).join("、")}{files.length > 5 ? " …" : ""}
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-500">也可以直接拖多张图片到此处，或 Ctrl+V 粘贴。</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="label" htmlFor="ip-format">输出格式</label>
            <select id="ip-format" className="field" value={opts.format} onChange={(e) => patch({ format: e.target.value as Options["format"] })}>
              <option value="original">保持原格式</option>
              <option value="image/jpeg">JPEG（.jpg）</option>
              <option value="image/png">PNG（.png）</option>
              <option value="image/webp">WebP（.webp）</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="ip-size">尺寸</label>
            <select id="ip-size" className="field" value={opts.sizeMode} onChange={(e) => patch({ sizeMode: e.target.value as Options["sizeMode"] })}>
              <option value="original">保持原尺寸</option>
              <option value="width">按宽度（px）</option>
              <option value="percent">按百分比（%）</option>
            </select>
            {opts.sizeMode === "width" && (
              <input className="field mt-2" type="number" min={16} max={8000} value={opts.width} onChange={(e) => patch({ width: Number(e.target.value) })} />
            )}
            {opts.sizeMode === "percent" && (
              <input className="field mt-2" type="number" min={1} max={100} value={opts.percent} onChange={(e) => patch({ percent: Number(e.target.value) })} />
            )}
          </div>
          <div>
            <label className="label" htmlFor="ip-quality">质量 {opts.quality}%</label>
            <input id="ip-quality" className="w-full accent-sky-600" type="range" min={10} max={100} value={opts.quality} onChange={(e) => patch({ quality: Number(e.target.value) })} />
            <p className="mt-1 text-xs text-slate-400">仅对 JPEG / WebP 生效</p>
          </div>
          <div>
            <label className="label" htmlFor="ip-radius">圆角 {opts.radius}%</label>
            <input id="ip-radius" className="w-full accent-sky-600" type="range" min={0} max={50} value={opts.radius} onChange={(e) => patch({ radius: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label" htmlFor="ip-wm">水印文字</label>
            <input id="ip-wm" className="field" value={opts.watermark} onChange={(e) => patch({ watermark: e.target.value })} placeholder="例如 iamxiaogang.cn（留空不加）" />
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-28 flex-1">
              <label className="label" htmlFor="ip-wmsize">字号 {opts.watermarkSize}%</label>
              <input id="ip-wmsize" className="w-full accent-sky-600" type="range" min={3} max={20} value={opts.watermarkSize} onChange={(e) => patch({ watermarkSize: Number(e.target.value) })} />
            </div>
            <div className="min-w-28 flex-1">
              <label className="label" htmlFor="ip-wmop">透明度 {opts.watermarkOpacity}</label>
              <input id="ip-wmop" className="w-full accent-sky-600" type="range" min={0.1} max={1} step={0.05} value={opts.watermarkOpacity} onChange={(e) => patch({ watermarkOpacity: Number(e.target.value) })} />
            </div>
            <div className="min-w-32">
              <label className="label" htmlFor="ip-wmpos">位置</label>
              <select id="ip-wmpos" className="field" value={opts.watermarkPos} onChange={(e) => patch({ watermarkPos: e.target.value as Options["watermarkPos"] })}>
                <option value="top-left">左上</option>
                <option value="top-right">右上</option>
                <option value="bottom-left">左下</option>
                <option value="bottom-right">右下</option>
                <option value="center">居中</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button className="btn" onClick={process} disabled={busy}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Images size={16} />}
            {busy ? "处理中…" : "开始批量处理"}
          </button>
          {results.length > 0 && (
            <button className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-sky-700" onClick={downloadAll}>
              <FileArchive size={16} className="mr-1.5 inline" />
              全部下载为 ZIP（{results.length} 张）
            </button>
          )}
        </div>
        {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((r, i) => (
            <div key={i} className="panel flex flex-col gap-2 p-3">
              <img src={r.url} alt={r.name} className="h-36 w-full rounded-lg border border-slate-100 object-cover" />
              <p className="truncate text-xs text-slate-600" title={r.name}>{r.name}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{formatSize(r.size)}</span>
                <button
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:border-sky-300 hover:text-sky-600"
                  onClick={() => triggerDownload(r.url, r.name)}
                >
                  <Download size={12} />下载
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
