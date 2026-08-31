import { useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { getParam } from "../../utils/params";

interface RGB { r: number; g: number; b: number }
interface HSL { h: number; s: number; l: number }

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function parseHex(input: string): RGB | null {
  const raw = input.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    const [r, g, b] = raw.split("").map((c) => parseInt(c + c, 16));
    return { r, g, b };
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) {
    return { r: parseInt(raw.slice(0, 2), 16), g: parseInt(raw.slice(2, 4), 16), b: parseInt(raw.slice(4, 6), 16) };
  }
  return null;
}

function parseRgb(input: string): RGB | null {
  const cleaned = input.replace(/rgba?\(/i, "").replace(/\)/g, "").trim();
  const parts = cleaned.split(/[\s,]+/).filter(Boolean).map(Number);
  if (parts.length < 3 || parts.slice(0, 3).some((n) => Number.isNaN(n))) return null;
  return {
    r: Math.max(0, Math.min(255, Math.round(parts[0]))),
    g: Math.max(0, Math.min(255, Math.round(parts[1]))),
    b: Math.max(0, Math.min(255, Math.round(parts[2]))),
  };
}

function parseHsl(input: string): HSL | null {
  const cleaned = input.replace(/hsla?\(/i, "").replace(/\)/g, "").trim();
  const parts = cleaned.split(/[\s,]+/).filter(Boolean).map((p) => parseFloat(p.replace("%", "")));
  if (parts.length < 3 || parts.slice(0, 3).some((n) => Number.isNaN(n))) return null;
  return {
    h: ((Math.round(parts[0]) % 360) + 360) % 360,
    s: Math.max(0, Math.min(100, Math.round(parts[1]))),
    l: Math.max(0, Math.min(100, Math.round(parts[2]))),
  };
}

function rgbToHex({ r, g, b }: RGB): string {
  return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: Math.round(h * 60), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function hslToRgb({ h, s, l }: HSL): RGB {
  const hn = h / 360, sn = s / 100, ln = l / 100;
  if (sn === 0) {
    const v = Math.round(ln * 255);
    return { r: v, g: v, b: v };
  }
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  return {
    r: Math.round(hue2rgb(p, q, hn + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hn) * 255),
    b: Math.round(hue2rgb(p, q, hn - 1 / 3) * 255),
  };
}

const PRESETS = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#64748b", "#111827", "#f8fafc"];

function Field({ label, value, onChange, placeholder, mono }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-sm font-medium text-slate-600">{label}</label>
        <button
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-0.5 text-xs text-slate-500 transition hover:border-rose-300 hover:text-rose-600"
          onClick={async () => {
            if (await copy(value)) {
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }
          }}
        >
          {copied ? <span className="text-emerald-600">已复制 ✓</span> : <><Copy size={12} />复制</>}
        </button>
      </div>
      <input
        className={`field ${mono ? "font-mono" : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
      />
    </div>
  );
}

export default function ColorTools() {
  const initialHex = getParam("hex") || "#6366f1";
  const initial = parseHex(initialHex) ?? { r: 99, g: 102, b: 241 };
  const [hex, setHex] = useState(initialHex);
  const [rgb, setRgb] = useState(`rgb(${initial.r}, ${initial.g}, ${initial.b})`);
  const h = rgbToHsl(initial);
  const [hsl, setHsl] = useState(`hsl(${h.h}, ${h.s}%, ${h.l}%)`);
  const [picker, setPicker] = useState(initialHex);
  const [error, setError] = useState("");

  const current: RGB | null = useMemo(() => parseHex(hex), [hex]);

  const applyRgb = (next: RGB) => {
    setHex(rgbToHex(next));
    setRgb(`rgb(${next.r}, ${next.g}, ${next.b})`);
    const h = rgbToHsl(next);
    setHsl(`hsl(${h.h}, ${h.s}%, ${h.l}%)`);
    setPicker(rgbToHex(next));
    setError("");
  };

  const onHexChange = (v: string) => {
    setHex(v);
    const rgbVal = parseHex(v);
    if (rgbVal) applyRgb(rgbVal);
    else if (v.trim()) setError("HEX 格式应为 #rgb 或 #rrggbb");
    else setError("");
  };

  const onRgbChange = (v: string) => {
    setRgb(v);
    const rgbVal = parseRgb(v);
    if (rgbVal) applyRgb(rgbVal);
    else if (v.trim()) setError("RGB 格式应为 rgb(r, g, b)，数值 0~255");
    else setError("");
  };

  const onHslChange = (v: string) => {
    setHsl(v);
    const hslVal = parseHsl(v);
    if (hslVal) applyRgb(hslToRgb(hslVal));
    else if (v.trim()) setError("HSL 格式应为 hsl(h, s%, l%)，h 0~360，s/l 0~100");
    else setError("");
  };

  return (
    <section className="flex flex-1 flex-col gap-4 p-5 sm:p-8">
      <div className="panel flex flex-col gap-5 p-5">
        <div className="flex flex-wrap items-center gap-5">
          <div
            className="grid h-28 w-28 shrink-0 place-items-center rounded-2xl border border-white/60 shadow-inner"
            style={{ backgroundColor: current ? rgbToHex(current) : "#ffffff" }}
          >
            <span className="rounded-lg bg-white/70 px-2 py-0.5 font-mono text-xs text-slate-700">{current ? rgbToHex(current) : "—"}</span>
          </div>
          <div>
            <label className="label" htmlFor="color-picker">取色器</label>
            <input
              id="color-picker"
              type="color"
              value={picker}
              onChange={(e) => {
                setPicker(e.target.value);
                onHexChange(e.target.value);
              }}
              className="h-12 w-24 cursor-pointer rounded-xl border border-slate-200 bg-white"
            />
          </div>
        </div>

        {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="HEX" value={hex} onChange={onHexChange} placeholder="#6366f1" mono />
          <Field label="RGB" value={rgb} onChange={onRgbChange} placeholder="rgb(99, 102, 241)" mono />
          <Field label="HSL" value={hsl} onChange={onHslChange} placeholder="hsl(239, 84%, 67%)" mono />
        </div>

        <div>
          <p className="label">常用色板（点击选用）</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((c) => (
              <button
                key={c}
                className="h-10 w-10 rounded-xl border border-slate-200 shadow-sm transition hover:scale-110"
                style={{ backgroundColor: c }}
                title={c}
                onClick={() => onHexChange(c)}
              />
            ))}
          </div>
        </div>

        {current && (
          <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            <span>R <b className="font-mono text-slate-800">{current.r}</b></span>
            <span>G <b className="font-mono text-slate-800">{current.g}</b></span>
            <span>B <b className="font-mono text-slate-800">{current.b}</b></span>
            <span>互补色 <b className="font-mono text-rose-600">{(() => { const c = rgbToHex({ r: 255 - current.r, g: 255 - current.g, b: 255 - current.b }); return c; })()}</b></span>
          </div>
        )}
      </div>
    </section>
  );
}
