"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type Kind = "error" | "success" | "info";
type Toast = { id: number; kind: Kind; title: string; description?: string };
type Notify = (kind: Kind, title: string, description?: string) => void;

const ToastContext = createContext<Notify>(() => {});
export const useToast = () => useContext(ToastContext);

const STYLE: Record<Kind, { icon: typeof Info; color: string }> = {
  error: { icon: AlertCircle, color: "#f0716a" },
  success: { icon: CheckCircle2, color: "#6fcf97" },
  info: { icon: Info, color: "#d9a47a" },
};

/** Notificaciones flotantes arriba a la derecha; se cierran solas a los 7 s. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const notify = useCallback<Notify>(
    (kind, title, description) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t.slice(-3), { id, kind, title, description }]);
      setTimeout(() => dismiss(id), 7000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
        {toasts.map(({ id, kind, title, description }) => {
          const { icon: Icon, color } = STYLE[kind];
          return (
            <div
              key={id}
              role={kind === "error" ? "alert" : "status"}
              className="pointer-events-auto flex gap-3 rounded-2xl border border-white/10 bg-[#161617]/95 p-4 text-white shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2"
              style={{ borderLeft: `3px solid ${color}` }}
            >
              <Icon className="mt-0.5 size-5 shrink-0" style={{ color }} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug">{title}</p>
                {description && <p className="mt-1 text-xs leading-relaxed text-white/65">{description}</p>}
              </div>
              <button onClick={() => dismiss(id)} aria-label="Cerrar" className="shrink-0 self-start text-white/40 hover:text-white">
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
