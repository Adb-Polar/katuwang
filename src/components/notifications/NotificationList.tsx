"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, CheckCheck, Inbox, UserPlus, PartyPopper, RefreshCw } from "lucide-react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";

interface NotificationRow {
  id: string;
  type: string;
  message: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  TOPIC_REQUEST_DIRECTED: <UserPlus className="h-4 w-4 text-info" />,
  TOPIC_REQUEST_ACCEPTED: <PartyPopper className="h-4 w-4 text-success" />,
  TOPIC_REQUEST_REOPENED: <RefreshCw className="h-4 w-4 text-warning" />,
  TOPIC_REQUEST_FULFILLED: <CheckCheck className="h-4 w-4 text-success" />,
};

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

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
    // Auto mark-all-read on mount — matches the badge clearing once viewed.
    (async () => {
      try {
        await fetch("/api/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        router.refresh();
      } catch {
        // non-fatal — sidebar badge will just stay stale until next load
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              {notifications.map((n) => {
                const content = (
                  <div
                    className={`flex items-start gap-3 py-3 px-2 -mx-2 rounded-lg text-xs ${
                      n.link ? "hover:bg-base-200/40" : ""
                    } ${!n.readAt ? "bg-primary/5" : ""}`}
                  >
                    <span className="mt-0.5 shrink-0">{TYPE_ICON[n.type] ?? <Bell className="h-4 w-4 text-base-content/40" />}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-base-content/80">{n.message}</p>
                      <p className="text-2xs text-base-content/40 mt-0.5">{relativeTime(n.createdAt)}</p>
                    </div>
                    {!n.readAt && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" aria-hidden="true" />}
                  </div>
                );
                return (
                  <li key={n.id}>
                    {n.link ? (
                      <Link href={n.link} className="block">
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
