import { useEffect, useRef, useState } from "react";
import { Download, ScanLine, Wand2 } from "lucide-react";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { useToast } from "../../components/Toast";
import { getParam } from "../../utils/params";

type Tab = "generate" | "scan";

async function clipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function QrCodeTool() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("generate");
  const [text, setText] = useState(getParam("text"));
  const [size, setSize] = useState(280);
  const [dark, setDark] = useState("#000000");
  const [light, setLight] = useState("#ffffff");
  const [qrUrl, setQrUrl] = useState("");
  const [qrError, setQrError] = useState("");

  const [scanResult, setScanResult] = useState("");
  const [scanError, setScanError] = useState("");
  const [preview, setPreview] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const generate = async () => {
    if (!text.trim()) {
      setQrError("请输入要生成二维码的内容。");
      return;
    }
    setQrError("");
    try {
      const url = await QRCode.toDataURL(text, {
        width: size,
        margin: 2,
        errorCorrectionLevel: "M",
        color: { dark, light },
      });
      setQrUrl(url);
    } catch (e) {
      setQrError(e instanceof Error ? e.message : "生成失败。");
    }
  };

  const scanFile = (file: File) => {
    setScanError("");
    setScanResult("");
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    const img = new Image();
    img.onload = () => {
      // 超过 1200px 先等比缩小，jsQR 对超大图性能差
      const maxSide = 1200;
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setScanError("浏览器不支持 Canvas，无法识别。");
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, imageData.width, imageData.height);
      if (result?.data) {
        setScanResult(result.data);
      } else {
        setScanError("未在图片中识别到二维码。");
      }
      URL.revokeObjectURL(objectUrl);
    };
    img.onerror = () => {
      setScanError("图片加载失败。");
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  };

  // 识别页支持直接粘贴截图
  useEffect(() => {
    if (tab !== "scan") return;
    const onPaste = (e: ClipboardEvent) => {
      const file = e.clipboardData?.files?.[0];
      if (file && file.type.startsWith("image/")) scanFile(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [tab]);

  return (
    <section className="flex flex-1 flex-col gap-4 p-5 sm:p-8">
      <div className="flex gap-2">
        <button
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === "generate" ? "bg-indigo-600 text-white shadow-md" : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}
          onClick={() => setTab("generate")}
        >
          <Wand2 size={15} className="mr-1.5 inline" />
          生成
        </button>
        <button
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === "scan" ? "bg-indigo-600 text-white shadow-md" : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}
          onClick={() => setTab("scan")}
        >
          <ScanLine size={15} className="mr-1.5 inline" />
          识别
        </button>
      </div>

      {tab === "generate" ? (
        <div className="panel flex flex-col gap-4 p-5">
          <div>
            <label className="label" htmlFor="qr-text">内容</label>
            <textarea
              id="qr-text"
              className="field min-h-28 font-mono text-[13px]"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="输入网址、文本、WiFi 配置等任意内容……"
            />
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-40 flex-1">
              <label className="label" htmlFor="qr-size">尺寸 {size}px</label>
              <input
                id="qr-size"
                type="range"
                min={120}
                max={600}
                step={10}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
            <div className="flex items-end gap-3">
              <div>
                <label className="label" htmlFor="qr-dark">前景色</label>
                <input id="qr-dark" type="color" value={dark} onChange={(e) => setDark(e.target.value)} className="h-9 w-14 cursor-pointer rounded-lg border border-slate-200" />
              </div>
              <div>
                <label className="label" htmlFor="qr-light">背景色</label>
                <input id="qr-light" type="color" value={light} onChange={(e) => setLight(e.target.value)} className="h-9 w-14 cursor-pointer rounded-lg border border-slate-200" />
              </div>
              <button className="btn" onClick={generate}>
                <Wand2 size={16} />
                生成二维码
              </button>
            </div>
          </div>
          {qrError && <p role="alert" className="text-sm text-rose-600">{qrError}</p>}
          {qrUrl && (
            <div className="flex flex-wrap items-start gap-5">
              <img src={qrUrl} alt="生成的二维码" className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm" width={size} height={size} />
              <div className="flex flex-col gap-2">
                <a className="btn" href={qrUrl} download="qrcode.png">
                  <Download size={16} />
                  下载 PNG
                </a>
                <button
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  onClick={async () => { if (await clipboard(text)) toast("内容已复制。"); }}
                >
                  复制内容
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className="panel flex flex-col gap-4 p-5"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file && file.type.startsWith("image/")) scanFile(file);
          }}
        >
          <div>
            <label className="label" htmlFor="qr-file">选择包含二维码的图片</label>
            <input
              id="qr-file"
              ref={fileRef}
              className="field"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) scanFile(file);
              }}
            />
          </div>
          {preview && <img src={preview} alt="待识别图片" className="max-h-72 rounded-xl border border-slate-200 object-contain" />}
          {scanError && <p role="alert" className="text-sm text-rose-600">{scanError}</p>}
          {scanResult && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="mb-1 text-sm font-medium text-emerald-700">识别结果</p>
              <p className="break-all font-mono text-sm text-slate-800">{scanResult}</p>
              <button
                className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                onClick={async () => { if (await clipboard(scanResult)) toast("结果已复制。"); }}
              >
                复制结果
              </button>
            </div>
          )}
          {!scanResult && !scanError && (
            <p className="text-sm text-slate-400">支持 PNG / JPG / WebP 等格式；也可以直接拖图片到此处，或 Ctrl+V 粘贴截图。</p>
          )}
        </div>
      )}
    </section>
  );
}
