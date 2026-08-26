import { Link } from "react-router-dom";
import { Server } from "lucide-react";
import { tools } from "../tools/registry";

export default function Welcome() {
  return (
    <section className="mx-auto w-full max-w-6xl p-5 sm:p-8">
      <h1 className="sr-only">工具箱</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tools.map(({ meta }) => {
          const Icon = meta.icon;
          return (
            <Link
              key={meta.id}
              to={meta.path}
              className="panel group flex items-center gap-4 p-5 transition duration-200 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-200/50"
            >
              <span
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${meta.accent} text-white shadow-md transition duration-200 group-hover:scale-110 group-hover:rotate-3`}
              >
                <Icon size={22} />
              </span>
              <span className="flex min-w-0 items-center gap-2 font-semibold text-slate-700">
                {meta.name}
                {meta.kind === "needs-backend" && <Server size={14} className="shrink-0 text-emerald-500" aria-label="需要后端" />}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
