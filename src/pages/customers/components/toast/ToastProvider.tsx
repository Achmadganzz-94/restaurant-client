import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

type ToastItem = {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
};

type ToastContextType = {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = Date.now() + Math.random();

      setToasts((prev) => [
        ...prev,
        {
          id,
          type,
          title,
          message,
        },
      ]);

      setTimeout(() => {
        removeToast(id);
      }, 3500);
    },
    [removeToast],
  );

  const success = useCallback(
    (title: string, message?: string) => {
      showToast("success", title, message);
    },
    [showToast],
  );

  const error = useCallback(
    (title: string, message?: string) => {
      showToast("error", title, message);
    },
    [showToast],
  );

  const info = useCallback(
    (title: string, message?: string) => {
      showToast("info", title, message);
    },
    [showToast],
  );

  const warning = useCallback(
    (title: string, message?: string) => {
      showToast("warning", title, message);
    },
    [showToast],
  );

  return (
    <ToastContext.Provider
      value={{
        success,
        error,
        info,
        warning,
      }}
    >
      {children}

      <div className="fixed right-5 top-5 z-[9999] flex w-[calc(100%-40px)] max-w-sm flex-col gap-3">
        {toasts.map((toast) => {
          const config = {
            success: {
              icon: CheckCircle2,
              iconClass: "text-emerald-400",
              borderClass: "border-emerald-500/30",
              bgClass: "bg-emerald-500/10",
            },
            error: {
              icon: XCircle,
              iconClass: "text-rose-400",
              borderClass: "border-rose-500/30",
              bgClass: "bg-rose-500/10",
            },
            info: {
              icon: Info,
              iconClass: "text-blue-400",
              borderClass: "border-blue-500/30",
              bgClass: "bg-blue-500/10",
            },
            warning: {
              icon: AlertTriangle,
              iconClass: "text-amber-400",
              borderClass: "border-amber-500/30",
              bgClass: "bg-amber-500/10",
            },
          }[toast.type];

          const Icon = config.icon;

          return (
            <div
              key={toast.id}
              className={`flex w-full items-start gap-3 rounded-xl border ${config.borderClass} ${config.bgClass} bg-zinc-950/95 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl`}
            >
              <div className="mt-0.5 shrink-0">
                <Icon size={20} strokeWidth={2} className={config.iconClass} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">
                  {toast.title}
                </p>

                {toast.message && (
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                    {toast.message}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 rounded-md p-1 text-zinc-500 transition hover:bg-white/5 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast harus digunakan di dalam ToastProvider");
  }

  return context;
}
