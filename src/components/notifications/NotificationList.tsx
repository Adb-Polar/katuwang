"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import {
  NotificationRow,
  TYPE_ICON,
  FALLBACK_ICON,
  relativeTime,
} from "@/components/notifications/notificationMeta";

export default function NotificationList() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) throw new Error("Could not load notifications.");
        const json = await res.json();
        setNotifications(json.notifications);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load notifications.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const markOneRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n))
    );
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      router.refresh();
    } catch {
      setError("Could not update notification.");
    }
  };

  const markAllRead = async () => {
    setMarking(true);
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
      router.refresh();
    } catch {
      setError("Could not mark notifications read.");
    } finally {
      setMarking(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="space-y-4">
      <FeedbackBanner variant="error" message={error || null} />

      <section className="card kt-card">
        <div className="card-body gap-4">
          <div className="flex items-center justify-between">
            <h2 className="card-title text-sm font-bold flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Notifications
            </h2>
            {unreadCount > 0 && (
              <button onClick={markAllRead} disabled={marking} className="btn btn-ghost btn-xs text-2xs gap-1">
                {marking ? <span className="loading loading-spinner loading-xs" /> : <CheckCheck className="h-3.5 w-3.5" />}
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <span className="loading loading-spinner loading-md text-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-10 bg-base-200/10 border border-dashed border-base-300 rounded-xl text-base-content/40 italic text-xs flex flex-col items-center gap-2">
              <Inbox className="h-5 w-5" />
              No notifications yet.
            </div>
          ) : (
            <ul className="divide-y divide-base-200">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      markOneRead(n.id);
                      if (n.link) router.push(n.link);
                    }}
                    className="block w-full text-left"
                  >
                    <div
                      className={`flex items-start gap-3 py-3 px-2 -mx-2 rounded-lg text-xs hover:bg-base-200/40 ${
                        !n.readAt ? "bg-primary/5" : ""
                      }`}
                    >
                      <span className="mt-0.5 shrink-0">{TYPE_ICON[n.type] ?? FALLBACK_ICON}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-base-content/80">{n.message}</p>
                        <p className="text-2xs text-base-content/40 mt-0.5">{relativeTime(n.createdAt)}</p>
                      </div>
                      {!n.readAt && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" aria-hidden="true" />}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
