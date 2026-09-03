"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import {
  NotificationRow,
  TYPE_ICON,
  FALLBACK_ICON,
  relativeTime,
} from "@/components/notifications/notificationMeta";

interface NotificationBellProps {
  unreadCount: number;
  notificationsHref: string;
}

export default function NotificationBell({ unreadCount, notificationsHref }: NotificationBellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Close the panel on navigation (adjust state during render — no effect).
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  // Outside-click + Escape while the panel is open.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Fetch the recent slice each time the panel opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/notifications?take=8");
        if (!res.ok) throw new Error("Could not load notifications.");
        const json = await res.json();
        if (!cancelled) {
          setItems(json.notifications);
          setLoaded(true);
        }
      } catch {
        if (!cancelled) setError("Could not load notifications.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleRowClick = (n: NotificationRow) => {
    setItems((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, readAt: x.readAt ?? new Date().toISOString() } : x))
    );
    fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [n.id] }),
    })
      .then(() => router.refresh())
      .catch(() => {});
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  const markAllRead = () => {
    setItems((prev) => prev.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() })));
    fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
      .then(() => router.refresh())
      .catch(() => {});
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="kt-icon-btn"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-1 top-1 h-2 w-2 rounded-full bg-error ring-2 ring-base-100"
          />
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Notifications"
          className="absolute right-0 top-full mt-2 w-80 max-h-[70vh] overflow-y-auto rounded-box border border-base-300 bg-base-100 shadow-lg z-30"
        >
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-base-200">
            <span className="text-xs font-bold flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 text-primary" />
              Notifications
            </span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="btn btn-ghost btn-xs text-2xs gap-1">
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {loading && !loaded ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-sm text-primary" />
            </div>
          ) : error ? (
            <p className="px-3 py-6 text-center text-2xs text-error">{error}</p>
          ) : items.length === 0 ? (
            <p className="px-3 py-8 text-center text-2xs italic text-base-content/40">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-base-200">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleRowClick(n)}
                    className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left text-xs hover:bg-base-200/40 ${
                      !n.readAt ? "bg-primary/5" : ""
                    }`}
                  >
                    <span className="mt-0.5 shrink-0">{TYPE_ICON[n.type] ?? FALLBACK_ICON}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base-content/80">{n.message}</span>
                      <span className="block text-2xs text-base-content/40 mt-0.5">{relativeTime(n.createdAt)}</span>
                    </span>
                    {!n.readAt && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-base-200 px-3 py-2 text-center">
            <Link
              href={notificationsHref}
              onClick={() => setOpen(false)}
              className="text-2xs font-semibold text-primary hover:underline"
            >
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
