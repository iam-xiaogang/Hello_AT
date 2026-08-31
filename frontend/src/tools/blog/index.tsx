import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, KeyRound, Pencil, Plus, Save, Settings2, Trash2, X } from "lucide-react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { apiFetch } from "../../api/client";
import { useToast } from "../../components/Toast";

interface ArticleListItem {
  id: number;
  title: string;
  category: string;
  summary: string;
  created_at: string;
  updated_at: string;
}

interface Article extends ArticleListItem {
  content: string;
}

type View =
  | { kind: "list" }
  | { kind: "detail"; article: Article }
  | { kind: "admin" }
  | { kind: "editor"; editing: Article | null };

const TOKEN_KEY = "toolbox.blogToken";

async function getJson<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  return (await res.json()) as T;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function CategoryBadge({ category }: { category: string }) {
  if (!category) return null;
  return (
    <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
      {category}
    </span>
  );
}

function Markdown({ content }: { content: string }) {
  const html = useMemo(
    () => DOMPurify.sanitize(marked.parse(content, { async: false, breaks: true }) as string),
    [content],
  );
  return <div className="blog-markdown" dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function Blog() {
  const { toast } = useToast();
  const [view, setView] = useState<View>({ kind: "list" });
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(TOKEN_KEY) ?? "";
    } catch {
      return "";
    }
  });
  // 是否已通过"进入管理"认证（与输入框内容分离，避免输入时视图跳变）
  const [authed, setAuthed] = useState(() => {
    try {
      return Boolean(localStorage.getItem(TOKEN_KEY));
    } catch {
      return false;
    }
  });

  const loadList = async (category = activeCategory) => {
    setLoading(true);
    setError("");
    try {
      const suffix = category ? `?category=${encodeURIComponent(category)}` : "";
      const data = await getJson<{ articles: ArticleListItem[]; total: number }>(`/tools/blog/articles${suffix}`);
      setArticles(data.articles);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败。");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getJson<{ categories: string[] }>("/tools/blog/categories");
      setCategories(data.categories);
    } catch {
      /* 分类加载失败不阻塞 */
    }
  };

  useEffect(() => {
    loadList("");
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDetail = async (id: number) => {
    try {
      const article = await getJson<Article>(`/tools/blog/articles/${id}`);
      setView({ kind: "detail", article });
    } catch (e) {
      toast(e instanceof Error ? e.message : "加载文章失败。", "error");
    }
  };

  const saveToken = () => {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable */
    }
    setAuthed(true);
    toast("管理令牌已保存。");
  };

  const clearToken = () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable */
    }
    setToken("");
    setAuthed(false);
  };

  // ---------- 列表 ----------
  if (view.kind === "list") {
    return (
      <section className="flex flex-1 flex-col gap-4 p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
              <BookOpen size={20} className="text-violet-500" /> 博客文章
            </h2>
            <p className="text-sm text-slate-500">共 {articles.length} 篇{activeCategory ? `（分类：${activeCategory}）` : ""}</p>
          </div>
          <button
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:text-slate-300"
            onClick={() => setView({ kind: "admin" })}
          >
            <Settings2 size={15} /> 管理
          </button>
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${activeCategory === "" ? "bg-violet-600 text-white" : "border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400"}`}
              onClick={() => { setActiveCategory(""); loadList(""); }}
            >
              全部
            </button>
            {categories.map((c) => (
              <button
                key={c}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${activeCategory === c ? "bg-violet-600 text-white" : "border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400"}`}
                onClick={() => { setActiveCategory(c); loadList(c); }}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}

        <div className="flex flex-col gap-3">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-400">加载中……</p>
          ) : articles.length === 0 ? (
            <div className="panel p-8 text-center">
              <p className="text-slate-400">还没有文章{activeCategory ? `（分类 ${activeCategory}）` : ""}，点击右上角"管理"发布第一篇吧。</p>
            </div>
          ) : (
            articles.map((a) => (
              <button
                key={a.id}
                className="panel group flex flex-col gap-2 p-5 text-left transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-200/40 dark:hover:border-violet-500/40"
                onClick={() => openDetail(a.id)}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-800 transition group-hover:text-violet-600 dark:text-slate-100 dark:group-hover:text-violet-300">
                    {a.title}
                  </h3>
                  <CategoryBadge category={a.category} />
                </div>
                {a.summary && <p className="line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{a.summary}</p>}
                <p className="text-xs text-slate-400">{formatDate(a.updated_at)}</p>
              </button>
            ))
          )}
        </div>
      </section>
    );
  }

  // ---------- 详情 ----------
  if (view.kind === "detail") {
    const a = view.article;
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-5 sm:p-8">
        <button
          className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:text-slate-300"
          onClick={() => setView({ kind: "list" })}
        >
          <ArrowLeft size={15} /> 返回列表
        </button>
        <article className="panel flex flex-col gap-3 p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{a.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <CategoryBadge category={a.category} />
            <span>{formatDate(a.updated_at)}</span>
          </div>
          {a.summary && <p className="border-l-2 border-violet-200 pl-3 text-sm text-slate-500 dark:border-violet-500/40 dark:text-slate-400">{a.summary}</p>}
          <div className="mt-2">
            <Markdown content={a.content} />
          </div>
        </article>
      </section>
    );
  }

  // ---------- 后台 / 编辑 ----------
  const adminTokenOk = authed;
  return (
    <section className="flex flex-1 flex-col gap-4 p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:text-slate-300"
          onClick={() => setView({ kind: "list" })}
        >
          <ArrowLeft size={15} /> 返回
        </button>
        {view.kind === "admin" && adminTokenOk && (
          <div className="flex gap-2">
            <button className="btn" onClick={() => setView({ kind: "editor", editing: null })}>
              <Plus size={16} /> 新建文章
            </button>
            <button
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-500 hover:text-rose-600"
              onClick={clearToken}
            >
              退出管理
            </button>
          </div>
        )}
      </div>

      {view.kind === "editor" ? (
        <EditorForm
          editing={view.editing}
          token={token}
          onSaved={async (id) => {
            toast("已保存。");
            await loadList("");
            if (id) await openDetail(id);
            else setView({ kind: "admin" });
          }}
          onCancel={() => setView({ kind: "admin" })}
        />
      ) : !adminTokenOk ? (
        <div className="panel mx-auto w-full max-w-md p-6">
          <p className="mb-1 flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
            <KeyRound size={17} className="text-violet-500" /> 输入管理令牌
          </p>
          <p className="mb-4 text-sm text-slate-500">令牌为后端配置的 TOOLBOX_BLOG_ADMIN_TOKEN，仅保存在本机浏览器。</p>
          <input
            className="field"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="输入管理令牌"
            onKeyDown={(e) => { if (e.key === "Enter") saveToken(); }}
          />
          <button className="btn mt-4 w-full" onClick={saveToken}>进入管理</button>
        </div>
      ) : (
        <AdminTable
          articles={articles}
          onEdit={async (a) => {
            try {
              const full = await getJson<Article>(`/tools/blog/articles/${a.id}`);
              setView({ kind: "editor", editing: full });
            } catch (e) {
              toast(e instanceof Error ? e.message : "加载文章失败。", "error");
            }
          }}
          onDelete={async (id) => {
            if (!window.confirm("确定删除这篇文章？")) return;
            try {
              await apiFetch(`/tools/blog/articles/${id}`, {
                method: "DELETE",
                headers: { "X-Blog-Token": token },
              });
              toast("已删除。");
              await loadList("");
            } catch (e) {
              toast(e instanceof Error ? e.message : "删除失败。", "error");
            }
          }}
        />
      )}
    </section>
  );
}

function EditorForm({ editing, token, onSaved, onCancel }: {
  editing: Article | null;
  token: string;
  onSaved: (id: number | null) => Promise<void>;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState(editing?.title ?? "");
  const [category, setCategory] = useState(editing?.category ?? "");
  const [summary, setSummary] = useState(editing?.summary ?? "");
  const [content, setContent] = useState(editing?.content ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) {
      toast("请填写标题。", "error");
      return;
    }
    setSaving(true);
    try {
      const body = JSON.stringify({ title, category, summary, content });
      if (editing) {
        await apiFetch(`/tools/blog/articles/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "X-Blog-Token": token },
          body,
        });
      } else {
        await apiFetch("/tools/blog/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Blog-Token": token },
          body,
        });
      }
      await onSaved(editing?.id ?? null);
    } catch (e) {
      toast(e instanceof Error ? e.message : "保存失败。", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="panel mx-auto flex w-full max-w-3xl flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100">{editing ? "编辑文章" : "新建文章"}</h2>
        <button className="rounded-lg p-2 text-slate-400 hover:text-slate-600" onClick={onCancel} aria-label="关闭">
          <X size={18} />
        </button>
      </div>
      <div>
        <label className="label" htmlFor="blog-title">标题 *</label>
        <input id="blog-title" className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="文章标题" />
      </div>
      <div>
        <label className="label" htmlFor="blog-category">分类</label>
        <input id="blog-category" className="field" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="例如：技术 / 随笔（留空不分类）" />
      </div>
      <div>
        <label className="label" htmlFor="blog-summary">摘要</label>
        <textarea id="blog-summary" className="field min-h-16" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="列表页展示的一句话摘要" />
      </div>
      <div>
        <label className="label" htmlFor="blog-content">正文（Markdown）</label>
        <textarea
          id="blog-content"
          className="field min-h-64 font-mono text-[13px]"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={"# 标题\n\n支持 **加粗**、`代码`、列表、引用、表格等 Markdown 语法"}
        />
      </div>
      <div className="flex gap-3">
        <button className="btn" onClick={save} disabled={saving}>
          <Save size={16} /> {saving ? "保存中…" : "保存"}
        </button>
        <button className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50" onClick={onCancel}>
          取消
        </button>
      </div>
    </div>
  );
}

function AdminTable({ articles, onEdit, onDelete }: {
  articles: ArticleListItem[];
  onEdit: (a: ArticleListItem) => void;
  onDelete: (id: number) => Promise<void>;
}) {
  if (articles.length === 0) {
    return (
      <div className="panel p-8 text-center text-sm text-slate-400">
        还没有文章，点右上角"新建文章"发布第一篇。
      </div>
    );
  }
  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:bg-slate-800/50">
              <th className="px-4 py-3 font-medium">标题</th>
              <th className="px-4 py-3 font-medium">分类</th>
              <th className="px-4 py-3 font-medium">更新时间</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.id} className="border-b border-slate-50 last:border-0 hover:bg-violet-50/40 dark:border-slate-800/60">
                <td className="max-w-64 truncate px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{a.title}</td>
                <td className="px-4 py-3 text-slate-500">{a.category || "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">{formatDate(a.updated_at)}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex gap-1.5">
                    <button className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-violet-300 hover:text-violet-600" onClick={() => onEdit(a)} aria-label="编辑" title="编辑">
                      <Pencil size={14} />
                    </button>
                    <button className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-rose-300 hover:text-rose-600" onClick={() => onDelete(a.id)} aria-label="删除" title="删除">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
