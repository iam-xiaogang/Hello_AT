import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Eraser, Loader2, Send, User } from "lucide-react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { useToast } from "../../components/Toast";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "toolbox.aiChat.messages";
const MAX_HISTORY = 20;

function loadHistory(): Msg[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data.slice(-MAX_HISTORY);
    }
  } catch {
    /* ignore */
  }
  return [];
}

function saveHistory(msgs: Msg[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-MAX_HISTORY)));
  } catch {
    /* ignore */
  }
}

function renderMarkdown(text: string): string {
  return DOMPurify.sanitize(marked.parse(text, { async: false, breaks: true }) as string);
}

export default function AiChat() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Msg[]>(loadHistory);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    const history: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(history);
    setInput("");
    setStreaming(true);

    const payload = history.slice(-MAX_HISTORY).map((m) => ({ role: m.role, content: m.content }));
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = import.meta.env.VITE_AI_API_TOKEN as string | undefined;
    if (token) headers["X-Api-Token"] = token;

    try {
      const res = await fetch("/api/tools/ai-chat/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({ messages: payload }),
      });
      if (!res.ok || !res.body) {
        let detail = `请求失败（${res.status}）`;
        try {
          const d = (await res.json()) as { detail?: string };
          if (d.detail) detail = d.detail;
        } catch {
          /* keep default */
        }
        throw new Error(detail);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";
      setMessages((msgs) => [...msgs, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const events = buf.split("\n\n");
        buf = events.pop() ?? "";
        for (const ev of events) {
          for (const line of ev.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const obj = JSON.parse(data) as { content?: string };
              if (obj.content) acc += obj.content;
            } catch {
              /* 忽略无法解析的分片 */
            }
          }
        }
        setMessages((msgs) => {
          const copy = msgs.slice();
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
      saveHistory([...history, { role: "assistant", content: acc }]);
    } catch (e) {
      toast(e instanceof Error ? e.message : "对话失败。", "error");
      setMessages(history);
    } finally {
      setStreaming(false);
    }
  };

  const clear = () => {
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4 p-5 sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
            <Bot size={20} className="text-indigo-500" /> AI 对话
          </h2>
          <p className="text-sm text-slate-500">DeepSeek 驱动，流式回复，支持 Markdown。</p>
        </div>
        <button
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:border-rose-300 hover:text-rose-600 dark:border-slate-700 dark:text-slate-300"
          onClick={clear}
        >
          <Eraser size={15} /> 清空对话
        </button>
      </div>

      <div className="panel flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-slate-400">
              <Bot size={40} className="opacity-40" />
              <p>开始和 AI 聊天吧，例如："帮我写一段自我介绍"</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-blue-400 to-indigo-600 text-white">
                  <Bot size={16} />
                </span>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                  m.role === "user"
                    ? "bg-gradient-to-r from-violet-500 to-indigo-500 text-white"
                    : "border border-slate-100 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                {m.role === "user" ? (
                  <span className="whitespace-pre-wrap break-words">{m.content}</span>
                ) : m.content ? (
                  <div className="blog-markdown !text-[15px]" dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
                ) : (
                  <span className="flex items-center gap-2 text-slate-400">
                    <Loader2 size={14} className="animate-spin" /> 思考中…
                  </span>
                )}
              </div>
              {m.role === "user" && (
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  <User size={16} />
                </span>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-100 p-3 dark:border-slate-800">
          <div className="flex items-end gap-2">
            <textarea
              className="field max-h-40 min-h-11 resize-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="输入消息，Enter 发送，Shift+Enter 换行"
              rows={1}
            />
            <button className="btn shrink-0" onClick={send} disabled={streaming || !input.trim()}>
              {streaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
