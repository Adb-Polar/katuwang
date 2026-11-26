"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";

export type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastOptions {
  /**
   * For an action that redirects: keep the toast until the new page is showing, then start
   * its display time. Otherwise a slow navigation could use the time up before it is seen.
   */
  awaitNavigation?: boolean;
}

type ShowToast = (message: string, variant?: ToastVariant, options?: ToastOptions) => void;

const TOAST_DURATION_MS = 4500;
/** Upper bound for a toast that is waiting on a navigation which never happens. */
const NAVIGATION_WAIT_MS = 15000;
const MAX_VISIBLE_TOASTS = 3;

const VARIANTS = {
  success: { cls: "kt-alert--success", Icon: CheckCircle, icon: "text-success" },
  error: { cls: "kt-alert--error", Icon: AlertCircle, icon: "text-error" },
  info: { cls: "kt-alert--info", Icon: Info, icon: "text-info" },
} as const;

const noopToast: ShowToast = () => {};
const ToastContext = createContext<ShowToast>(noopToast);

/** Confirms a finished action. Outside a ToastProvider the call does nothing. */
export function useToast(): ShowToast {
  return useContext(ToastContext);
}

/**
 * Mounted once in the root layout, so a toast raised just before `router.push()`
 * stays on screen across the navigation.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const awaitingNavigation = useRef(new Set<number>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    awaitingNavigation.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const startTimer = useCallback((id: number, delay: number) => {
    const running = timers.current.get(id);
    if (running) clearTimeout(running);
    timers.current.set(id, setTimeout(() => dismiss(id), delay));
  }, [dismiss]);

  const show = useCallback<ShowToast>((message, variant = "success", options) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, message, variant }].slice(-MAX_VISIBLE_TOASTS));
    if (options?.awaitNavigation) awaitingNavigation.current.add(id);
    startTimer(id, options?.awaitNavigation ? NAVIGATION_WAIT_MS : TOAST_DURATION_MS);
  }, [startTimer]);

  // The new page is on screen: give toasts that waited for it their full display time.
  const pathname = usePathname();
  useEffect(() => {
    awaitingNavigation.current.forEach((id) => startTimer(id, TOAST_DURATION_MS));
    awaitingNavigation.current.clear();
  }, [pathname, startTimer]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => clearTimeout(timer));
  }, []);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast toast-end toast-bottom z-[100]" aria-live="polite" aria-atomic="false">
        {toasts.map(({ id, message, variant }) => {
          const { cls, Icon, icon } = VARIANTS[variant];
          return (
            <div key={id} role="status" className={`kt-alert ${cls} kt-toast text-sm`}>
              <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${icon}`} aria-hidden="true" />
              <span className="text-base-content">{message}</span>
              <button type="button" className="ml-2 shrink-0 text-(--kt-muted) hover:text-base-content" aria-label="Dismiss" onClick={() => dismiss(id)}>
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
