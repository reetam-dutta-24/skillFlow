"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/core/Icon.jsx";

type Toast = { id: number; message: string; tone: "success" | "info" };

const ToastContext = createContext<(message: string, tone?: Toast["tone"]) => void>(() => {});

/**
 * Quiet confirmations for actions that succeeded ("Saved.", "Following Chess.").
 * Errors stay inline next to the field that caused them; they are never only a toast.
 * One polite live region, so a screen reader hears it without losing its place.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(0);

  const show = useCallback((message: string, tone: Toast["tone"] = "success") => {
    next.current += 1;
    const id = next.current;
    setToasts((current) => [...current.slice(-2), { id, message, tone }]);
  }, []);

  const dismiss = useCallback((id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="sf-toasts" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDone={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDone }: { toast: Toast; onDone: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDone(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDone]);
  return (
    <p className={`sf-toast is-${toast.tone}`}>
      <Icon name={toast.tone === "success" ? "circle-check" : "info"} size={16} />
      <span>{toast.message}</span>
      <button type="button" className="sf-toast-close" aria-label="Dismiss" onClick={() => onDone(toast.id)}>
        <Icon name="x" size={14} />
      </button>
    </p>
  );
}

/** `const toast = useToast(); toast("Saved.")` */
export function useToast() {
  return useContext(ToastContext);
}
