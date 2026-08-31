import { useMemo, useState } from "react";
import { diffChars, diffLines } from "diff";
import { getParam } from "../../utils/params";

interface Cell {
  text: string;
  type: "same" | "del" | "add" | "mod";
}

interface Row {
  left?: Cell;
  right?: Cell;
}

function linesOf(value: string): string[] {
  const lines = value.split("\n");
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

function buildRows(oldText: string, newText: string): Row[] {
  const parts = diffLines(oldText, newText);
  const rows: Row[] = [];
  let i = 0;

  const pushPair = (left: string[], right: string[]) => {
    const n = Math.max(left.length, right.length);
    for (let k = 0; k < n; k++) {
      const l = left[k] ?? "";
      const r = right[k] ?? "";
      if (l === r) {
        rows.push({ left: { text: l, type: "same" }, right: { text: r, type: "same" } });
      } else {
        rows.push({
          left: { text: l, type: l === "" ? "del" : "mod" },
          right: { text: r, type: r === "" ? "add" : "mod" },
        });
      }
    }
  };

  while (i < parts.length) {
    const p = parts[i];
    if (!p.added && !p.removed) {
      for (const line of linesOf(p.value)) {
        rows.push({ left: { text: line, type: "same" }, right: { text: line, type: "same" } });
      }
      i++;
      continue;
    }
    const next = parts[i + 1];
    if (p.removed && next?.added) {
      pushPair(linesOf(p.value), linesOf(next.value));
      i += 2;
      continue;
    }
    if (p.added && next?.removed) {
      pushPair(linesOf(next.value), linesOf(p.value));
      i += 2;
      continue;
    }
    if (p.removed) {
      for (const line of linesOf(p.value)) rows.push({ left: { text: line, type: "del" } });
      i++;
      continue;
    }
    if (p.added) {
      for (const line of linesOf(p.value)) rows.push({ right: { text: line, type: "add" } });
      i++;
      continue;
    }
    i++;
  }
  return rows;
}

/** 逐字差异分段：左格取删除/相同，右格取新增/相同 */
function charSegments(left: string, right: string): { left: { text: string; kind: "same" | "del" }[]; right: { text: string; kind: "same" | "add" }[] } {
  const parts = diffChars(left, right);
  const leftSegs: { text: string; kind: "same" | "del" }[] = [];
  const rightSegs: { text: string; kind: "same" | "add" }[] = [];
  for (const part of parts) {
    if (part.removed) leftSegs.push({ text: part.value, kind: "del" });
    else if (part.added) rightSegs.push({ text: part.value, kind: "add" });
    else {
      leftSegs.push({ text: part.value, kind: "same" });
      rightSegs.push({ text: part.value, kind: "same" });
    }
  }
  return { left: leftSegs, right: rightSegs };
}

function CellContent({ cell, pairText, side }: { cell: Cell; pairText?: string; side: "left" | "right" }) {
  const text = cell.text === "" ? " " : cell.text;
  if (cell.type !== "mod" || pairText === undefined) {
    const bg = cell.type === "del" ? "bg-rose-100 text-rose-700" : cell.type === "add" ? "bg-emerald-100 text-emerald-700" : "text-slate-700";
    return <span className={bg}>{text}</span>;
  }
  const { left, right } = charSegments(cell.text, pairText);
  const segs = side === "left" ? left : right;
  return (
    <>
      {segs.map((s, i) => (
        <span key={i} className={s.kind === "del" ? "bg-rose-200 text-rose-800" : s.kind === "add" ? "bg-emerald-200 text-emerald-800" : ""}>{s.text === "" ? " " : s.text}</span>
      ))}
    </>
  );
}

export default function TextDiff() {
  const [oldText, setOldText] = useState(getParam("old"));
  const [newText, setNewText] = useState(getParam("new"));

  const rows = useMemo(() => buildRows(oldText, newText), [oldText, newText]);
  const stats = useMemo(() => {
    let del = 0, add = 0;
    for (const row of rows) {
      if (row.left && row.left.type !== "same") del++;
      if (row.right && row.right.type !== "same") add++;
    }
    return { del, add };
  }, [rows]);

  return (
    <section className="flex flex-1 flex-col gap-4 p-5 sm:p-8">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <label className="label" htmlFor="diff-old">原文</label>
          <textarea
            id="diff-old"
            className="field min-h-44 font-mono text-[13px]"
            value={oldText}
            onChange={(e) => setOldText(e.target.value)}
            placeholder="粘贴原始文本……"
          />
        </div>
        <div>
          <label className="label" htmlFor="diff-new">新文</label>
          <textarea
            id="diff-new"
            className="field min-h-44 font-mono text-[13px]"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="粘贴修改后的文本……"
          />
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-500">
          <span>
            差异行数：<b className="text-rose-600">删除 {stats.del}</b> · <b className="text-emerald-600">新增 {stats.add}</b>
          </span>
          <span className="flex items-center gap-3">
            <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-rose-200 align-middle" />删除</span>
            <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-emerald-200 align-middle" />新增</span>
            <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-slate-100 align-middle" />相同</span>
          </span>
        </div>
        <div className="overflow-x-auto">
          {rows.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">输入两段文本后自动对比</p>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="w-1/2 bg-white/60 px-3 py-1.5 font-medium">原文</th>
                  <th className="w-1/2 bg-white/60 px-3 py-1.5 font-medium">新文</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0">
                    <td className={`px-3 py-0.5 align-top font-mono text-[13px] leading-6 ${row.left && row.left.type !== "same" ? "bg-rose-50/70" : ""}`}>
                      {row.left ? <CellContent cell={row.left} side="left" pairText={row.right?.type === "mod" ? row.right.text : undefined} /> : <span className="text-slate-300">·</span>}
                    </td>
                    <td className={`px-3 py-0.5 align-top font-mono text-[13px] leading-6 ${row.right && row.right.type !== "same" ? "bg-emerald-50/70" : ""}`}>
                      {row.right ? <CellContent cell={row.right} side="right" pairText={row.left?.type === "mod" ? row.left.text : undefined} /> : <span className="text-slate-300">·</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}
