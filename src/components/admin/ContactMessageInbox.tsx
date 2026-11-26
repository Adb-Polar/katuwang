"use client";

import { useEffect, useState } from "react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import LoadingRow from "@/components/ui/LoadingRow";
import Pagination from "@/components/ui/Pagination";
import Tabs from "@/components/ui/Tabs";
import AnonymousIdText from "@/components/ui/AnonymousIdText";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime } from "@/lib/datetime";
import { ADMIN_PAGE_SIZE } from "@/lib/pagination";
import { contactCategoryLabel } from "@/lib/validations/contact";

type Status = "OPEN" | "HANDLED";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  category: string;
  message: string;
  status: Status;
  createdAt: string;
  handledAt: string | null;
  handledBy: { anonymousId: string } | null;
}

interface Inbox {
  messages: ContactMessage[];
  total: number;
  openCount: number;
}

export default function ContactMessageInbox() {
  const toast = useToast();
  const [status, setStatus] = useState<Status>("OPEN");
  const [page, setPage] = useState(1);
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/contact-messages?status=${status}&page=${page}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load the contact messages.");
        if (!cancelled) {
          setInbox(data);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load the contact messages.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, page, version]);

  const setMessageStatus = async (message: ContactMessage, next: Status) => {
    setSavingId(message.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/contact-messages/${message.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update the message.");
      toast(next === "HANDLED" ? "Message marked as handled." : "Message reopened.");
      // Stepping back keeps the admin off an empty last page.
      if (inbox?.messages.length === 1 && page > 1) setPage(page - 1);
      else setVersion((v) => v + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the message.");
    } finally {
      setSavingId(null);
    }
  };

  const changeTab = (key: string) => {
    setStatus(key as Status);
    setPage(1);
    setInbox(null);
  };

  return (
    <div className="space-y-4">
      <Tabs
        tabs={[
          { key: "OPEN", label: "Open", count: inbox?.openCount },
          { key: "HANDLED", label: "Handled" },
        ]}
        active={status}
        onChange={changeTab}
      />
      <FeedbackBanner variant="error" message={error || null} />

      {!inbox && !error ? (
        <LoadingRow />
      ) : inbox && inbox.messages.length === 0 ? (
        <section className="card kt-card">
          <p className="kt-card-body text-(--kt-muted)">
            {status === "OPEN" ? "No messages are waiting for a reply." : "No messages have been handled yet."}
          </p>
        </section>
      ) : inbox ? (
        <section className="card kt-card" aria-label={status === "OPEN" ? "Open contact messages" : "Handled contact messages"}>
          <ul>
            {inbox.messages.map((m) => (
              <li key={m.id} className="px-5 py-5 border-b border-(--kt-border) last:border-b-0 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <div className="min-w-0">
                    <p className="text-sm text-(--kt-muted)">
                      {contactCategoryLabel(m.category)} · {formatDateTime(m.createdAt)}
                    </p>
                    <h2 className="font-serif text-xl font-medium leading-snug break-words">{m.name}</h2>
                    <a href={`mailto:${m.email}`} className="link link-hover text-primary break-all">
                      {m.email}
                    </a>
                  </div>
                  <button
                    type="button"
                    className={`btn ${m.status === "OPEN" ? "btn-primary" : "btn-outline"} shrink-0`}
                    disabled={savingId === m.id}
                    onClick={() => setMessageStatus(m, m.status === "OPEN" ? "HANDLED" : "OPEN")}
                  >
                    {savingId === m.id ? "Saving…" : m.status === "OPEN" ? "Mark as handled" : "Reopen"}
                  </button>
                </div>
                <p className="max-w-prose break-words whitespace-pre-wrap">{m.message}</p>
                {m.status === "HANDLED" && m.handledAt && (
                  <p className="text-sm text-(--kt-muted)">
                    Handled {formatDateTime(m.handledAt)}
                    {m.handledBy && (
                      <>
                        {" "}
                        by <AnonymousIdText id={m.handledBy.anonymousId} role="ADMIN" />
                      </>
                    )}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {inbox && <Pagination page={page} pageSize={ADMIN_PAGE_SIZE} total={inbox.total} onPageChange={setPage} />}
    </div>
  );
}
