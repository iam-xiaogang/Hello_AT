import { Link } from "react-router-dom";
import { Clock, Server, Star } from "lucide-react";
import { tools } from "../tools/registry";
import { useToolPrefs } from "../state/toolPrefs";

function ToolCard({ id, path, name, description, icon: Icon, accent, needsBackend }: {
  id: string; path: string; name: string; description: string;
  icon: typeof tools[number]["meta"]["icon"]; accent: string; needsBackend: boolean;
}) {
  const { favorites, toggleFavorite } = useToolPrefs();
  const favorited = favorites.includes(id);
  return (
    <div className="group relative">
      <Link
        to={path}
        className="panel flex items-center gap-4 p-5 transition duration-200 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-200/50 dark:hover:border-violet-500/40"
      >
        <span
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-md transition duration-200 group-hover:scale-110 group-hover:rotate-3`}
        >
          <Icon size={22} />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
            {name}
            {needsBackend && <Server size={14} className="shrink-0 text-emerald-500" aria-label="需要后端" />}
          </span>
          <span className="mt-0.5 line-clamp-1 text-xs text-slate-400">{description}</span>
        </span>
      </Link>
      <button
        className={`absolute right-3 top-3 rounded-md p-1.5 transition hover:bg-amber-50 dark:hover:bg-amber-500/10 ${favorited ? "text-amber-400" : "text-slate-300 opacity-0 group-hover:opacity-100"}`}
        aria-label={favorited ? "取消收藏" : "收藏"}
        title={favorited ? "取消收藏" : "收藏"}
        onClick={() => toggleFavorite(id)}
      >
        <Star size={17} fill={favorited ? "currentColor" : "none"} />
      </button>
    </div>
  );
}

export default function Welcome() {
  const { favorites, recent } = useToolPrefs();
  const favTools = favorites
    .map((id) => tools.find((t) => t.meta.id === id))
    .filter((t): t is typeof tools[number] => Boolean(t));
  const recentTools = recent
    .map((id) => tools.find((t) => t.meta.id === id))
    .filter((t): t is typeof tools[number] => Boolean(t))
    .filter((t) => !favorites.includes(t.meta.id))
    .slice(0, 6);

  const Chip = ({ t }: { t: typeof tools[number] }) => {
    const Icon = t.meta.icon;
    return (
      <Link
        to={t.meta.path}
        className="panel flex items-center gap-2 px-3 py-2 text-sm text-slate-600 transition hover:-translate-y-0.5 hover:text-violet-600 dark:text-slate-300"
      >
        <span className={`grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br ${t.meta.accent} text-white`}>
          <Icon size={14} />
        </span>
        {t.meta.name}
      </Link>
    );
  };

  return (
    <section className="mx-auto w-full max-w-6xl p-5 sm:p-8">
      <h1 className="sr-only">工具箱</h1>

      {favTools.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
            <Star size={14} className="text-amber-400" fill="currentColor" /> 收藏
          </p>
          <div className="flex flex-wrap gap-2">
            {favTools.map((t) => <Chip key={t.meta.id} t={t} />)}
          </div>
        </div>
      )}

      {recentTools.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
            <Clock size={14} /> 最近使用
          </p>
          <div className="flex flex-wrap gap-2">
            {recentTools.map((t) => <Chip key={t.meta.id} t={t} />)}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tools.map(({ meta }) => (
          <ToolCard
            key={meta.id}
            id={meta.id}
            path={meta.path}
            name={meta.name}
            description={meta.description}
            icon={meta.icon}
            accent={meta.accent}
            needsBackend={meta.kind === "needs-backend"}
          />
        ))}
      </div>
    </section>
  );
}
