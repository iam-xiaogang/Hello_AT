import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CornerDownLeft, Search, Star } from "lucide-react";
import { tools } from "../tools/registry";
import { useToolPrefs } from "../state/toolPrefs";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useToolPrefs();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tools;
    return tools.filter(({ meta }) =>
      [meta.name, meta.description, meta.category, meta.id].some((s) => s.toLowerCase().includes(q)),
    );
  }, [query]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!open) return null;

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/60 bg-white/95 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 dark:border-slate-800">
          <Search size={17} className="shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-slate-400 dark:text-slate-100"
            placeholder="搜索工具（名称 / 功能 / 分类）……"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") {
                const r = results[active];
                if (r) go(r.meta.path);
              } else if (e.key === "Escape") {
                onClose();
              }
            }}
          />
        </div>
        <ul className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-slate-400">没有匹配的工具</li>
          )}
          {results.map(({ meta }, i) => {
            const Icon = meta.icon;
            const favorited = favorites.includes(meta.id);
            return (
              <li key={meta.id} className="group relative">
                <button
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 pr-10 text-left text-sm ${i === active ? "bg-violet-50 dark:bg-violet-500/10" : ""}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(meta.path)}
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${meta.accent} text-white`}>
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-700 dark:text-slate-200">{meta.name}</span>
                    <span className="block truncate text-xs text-slate-400">{meta.description}</span>
                  </span>
                  <span className="shrink-0 text-xs text-slate-300">{meta.category}</span>
                  {i === active && <CornerDownLeft size={14} className="shrink-0 text-violet-400" />}
                </button>
                <button
                  className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 opacity-0 transition group-hover:opacity-100 ${favorited ? "opacity-100 text-amber-400" : "text-slate-300 hover:text-amber-400"}`}
                  aria-label={favorited ? "取消收藏" : "收藏"}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(meta.id);
                  }}
                >
                  <Star size={15} fill={favorited ? "currentColor" : "none"} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
