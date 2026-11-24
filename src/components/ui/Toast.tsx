"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";

type ToastVariant = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const TOAST_LIFETIME_MS = 4000;
const MAX_VISIBLE_TOASTS = 4;

const noop = () => {};
const NOOP_API: ToastApi = { success: noop, error: noop, info: noop, warning: noop };

const ToastContext = createContext<ToastApi>(NOOP_API);

/** Confirmation toasts for completed actions. Safe to call outside a provider (no-op). */
export function useToast(): ToastApi {
  return useContext(ToastContext);
}

/**
 * Mounted once at the app root so a toast raised just before `router.push`
 * is still on screen after the navigation lands.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const show = useCallback(
    (variant: ToastVariant, message: string) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, variant, message }].slice(-MAX_VISIBLE_TOASTS));
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), TOAST_LIFETIME_MS)
      );
    },
    [dismiss]
  );

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => clearTimeout(timer));
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => show("success", message),
      error: (message) => show("error", message),
      info: (message) => show("info", message),
      warning: (message) => show("warning", message),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast toast-top toast-end z-[70] max-w-[min(24rem,calc(100vw-2rem))]" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className="kt-toast flex items-start gap-1 shadow-lg rounded-field" data-variant={toast.variant}>
            <div className="flex-1 whitespace-normal">
              <FeedbackBanner variant={toast.variant} message={toast.message} />
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-xs btn-square mt-1.5 -ml-9 mr-1.5 relative"
              aria-label="Dismiss notification"
              onClick={() => dismiss(toast.id)}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
