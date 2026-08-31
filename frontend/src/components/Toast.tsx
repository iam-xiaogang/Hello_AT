import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";

type ToastType = "success" | "info" | "error";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast 必须在 <ToastProvider> 内使用");
  return ctx;
}

const ICONS: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 size={16} className="text-emerald-500" />,
  info: <Info size={16} className="text-sky-500" />,
  error: <XCircle size={16} className="text-rose-500" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++idRef.current;
    setToasts((list) => [...list, { id, type, message }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 2600);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex animate-toast-in items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-4 py-2.5 text-sm text-slate-700 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {ICONS[t.type]}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
