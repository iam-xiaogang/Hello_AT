import { Link } from "react-router-dom";
import { Server } from "lucide-react";
import { tools } from "../tools/registry";

export default function Welcome() {
  return (
    <section>
      <h1 className="sr-only">工具箱</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tools.map(({ meta }) => {
          const Icon = meta.icon;
          return (
            <Link
              key={meta.id}
              to={meta.path}
              className="panel group flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
            >
              <span className="rounded-lg bg-slate-100 p-2.5 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-600">
                <Icon size={20} />
              </span>
              <span className="flex min-w-0 items-center gap-2 font-semibold">
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
