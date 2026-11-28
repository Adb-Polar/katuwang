"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { keepCodesTogether, readableSubjects } from "@/lib/displayLabels";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import {
  NotificationRow,
  notificationKind,
  notificationLinkLabel,
  notificationWhen,
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
    <div className="flex flex-col gap-4">
      <FeedbackBanner variant="error" message={error || null} />

      {unreadCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-(--kt-radius-box) bg-(--kt-tint-primary) px-5 py-4">
          <p className="flex items-baseline gap-2">
            <span className="font-serif text-3xl leading-none text-primary">{unreadCount}</span>
            <span>new since you last looked</span>
          </p>
          <button type="button" onClick={markAllRead} disabled={marking} className="btn btn-outline bg-base-100">
            {marking && <span className="loading loading-spinner loading-sm" />}
            Mark all as read
          </button>
        </div>
      ) : (
        !loading && notifications.length > 0 && <p className="text-sm text-(--kt-muted)">You&apos;re all caught up.</p>
      )}

      <section className="card kt-card" aria-label="Notifications" aria-busy={loading}>
        {loading ? (
          <p role="status" className="kt-card-body text-sm text-(--kt-muted)">Loading notifications…</p>
        ) : notifications.length === 0 ? (
          <p className="kt-card-body text-(--kt-muted)">
            Nothing yet. When a class changes, a test opens or a request is answered, it shows up here.
          </p>
        ) : (
          <ul>
            {notifications.map((n) => {
              const kind = notificationKind(n.type);
              const unread = !n.readAt;
              return (
                <li key={n.id} className="border-b border-(--kt-border) last:border-b-0">
                  <button
                    type="button"
                    onClick={() => {
                      markOneRead(n.id);
                      if (n.link) router.push(n.link);
                    }}
                    className={`w-full block px-5 py-4 text-left border-l-2 transition-colors ${
                      unread ? "border-l-primary bg-primary/5 hover:bg-primary/10" : "border-l-transparent hover:bg-base-200"
                    }`}
                  >
                    <span className="block min-w-0">
                      <span className="block text-sm text-(--kt-muted)">
                        {kind} · {notificationWhen(n.createdAt)}
                        {unread && <span className="text-primary font-medium"> · New</span>}
                      </span>
                      <span className={`block break-words ${unread ? "font-medium" : ""}`}>{keepCodesTogether(readableSubjects(n.message))}</span>
                      {n.link && (
                        <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary">
                          {notificationLinkLabel(n.type)}
                          <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
