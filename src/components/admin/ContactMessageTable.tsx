"use client";

import { useState } from "react";
import { ADMIN_PAGE_SIZE } from "@/lib/pagination";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import Pagination from "@/components/ui/Pagination";
import Tabs from "@/components/ui/Tabs";
import LoadingRow from "@/components/ui/LoadingRow";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import PromptDialog from "@/components/ui/PromptDialog";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime } from "@/lib/datetime";
import { CONTACT_NOTE_MAX } from "@/lib/validations/contact";

type MessageStatus = "OPEN" | "RESOLVED";

interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: MessageStatus;
  adminNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  sender: { id: string; anonymousId: string; role: string; status: string } | null;
  resolvedBy: { anonymousId: string } | null;
}

export default function ContactMessageTable() {
  const toast = useToast();
  const [status, setStatus] = useState<MessageStatus>("OPEN");
  const [resolveTarget, setResolveTarget] = useState<ContactMessageRow | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: messages, total, meta, page, setPage, pageSize, setPageSize, loading, error, setError, refetch } =
    usePaginatedList<ContactMessageRow>(
      "/api/admin/contact-messages",
      "messages",
      { status },
      ADMIN_PAGE_SIZE,
      "Could not load contact messages.",
      "contact"
    );
  const counts = (meta.counts ?? {}) as Partial<Record<MessageStatus, number>>;

  const review = async (row: ContactMessageRow, nextStatus: MessageStatus, adminNote = "") => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/contact-messages/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, adminNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update the message.");
      toast.success(nextStatus === "RESOLVED" ? "Message marked as resolved." : "Message re-opened.");
      setResolveTarget(null);
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the message.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="error" message={error || null} />

      <section className="card kt-card">
        <div className="card-body gap-4">
          <Tabs
            tabs={[
              { key: "OPEN", label: "Open", count: counts.OPEN },
              { key: "RESOLVED", label: "Resolved", count: counts.RESOLVED },
            ]}
            active={status}
            onChange={(key) => setStatus(key as MessageStatus)}
          />

          {loading ? (
            <LoadingRow />
          ) : messages.length === 0 ? (
            <EmptyState>
              {status === "OPEN"
                ? "No open messages. Anything sent through the public contact form appears here."
                : "No resolved messages yet. Messages you mark as resolved move to this tab."}
            </EmptyState>
          ) : (
            <ul className="space-y-3">
              {messages.map((row) => (
                <li key={row.id} className="rounded-lg border border-base-300 bg-base-200/40 p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{row.subject}</p>
                      <p className="text-2xs text-base-content/60 break-all">
                        {row.name} ·{" "}
                        <a href={`mailto:${row.email}`} className="link link-primary">
                          {row.email}
                        </a>{" "}
                        · {formatDateTime(row.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {row.sender ? (
                        <StatusBadge tone="info" label={`Signed in as ${row.sender.anonymousId}`} size="xs" />
                      ) : (
                        <StatusBadge tone="neutral" label="Not signed in" size="xs" />
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-base-content/80 whitespace-pre-wrap break-words">{row.message}</p>

                  {row.status === "RESOLVED" && (
                    <p className="text-2xs text-base-content/60 border-t border-base-300 pt-2">
                      Resolved{row.resolvedBy ? ` by ${row.resolvedBy.anonymousId}` : ""}
                      {row.resolvedAt ? ` on ${formatDateTime(row.resolvedAt)}` : ""}
                      {row.adminNote ? ` — ${row.adminNote}` : ""}
                    </p>
                  )}

                  <div className="flex justify-end">
                    {row.status === "OPEN" ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-xs text-2xs"
                        disabled={saving}
                        onClick={() => setResolveTarget(row)}
                      >
                        Mark resolved
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-2xs"
                        disabled={saving}
                        onClick={() => review(row, "OPEN")}
                      >
                        Re-open
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
      </section>

      <PromptDialog
        open={resolveTarget !== null}
        title="Mark this message as resolved?"
        description="Reply to the sender by email first — resolving only files the message away."
        noteLabel="Internal note (optional)"
        notePlaceholder="What was done about it"
        noteMax={CONTACT_NOTE_MAX}
        confirmLabel="Mark resolved"
        loading={saving}
        onConfirm={(note) => resolveTarget && review(resolveTarget, "RESOLVED", note)}
        onCancel={() => setResolveTarget(null)}
      />
    </div>
  );
}
