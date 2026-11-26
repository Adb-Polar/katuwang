"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MoreVertical, Pencil, Eye, EyeOff, CheckCircle, XCircle, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

type PendingAction = "cancel" | "complete" | "delete" | null;

export default function ClassManageMenu({
  classId,
  status,
  published,
  hasEnrollments,
}: {
  classId: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "SUSPENDED" | "BANNED";
  published: boolean;
  hasEnrollments: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);

  const handleConfirm = async () => {
    if (!pendingAction) return;
    setLoading(true);
    setError("");
    try {
      if (pendingAction === "delete") {
        const res = await fetch(`/api/tutor/classes/${classId}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to delete class.");
        toast("Class deleted.", "success", { awaitNavigation: true });
        router.push("/tutor/classes");
        return;
      }

      const res = await fetch(`/api/tutor/classes/${classId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: pendingAction === "cancel" ? "CANCELLED" : "COMPLETED" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update class.");
      toast(pendingAction === "cancel" ? "Class cancelled." : "Class marked as completed.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

  const handleTogglePublish = async () => {
    setPublishing(true);
    setError("");
    try {
      const res = await fetch(`/api/tutor/classes/${classId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !published }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update class.");
      toast(published ? "Class unpublished." : "Class published.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPublishing(false);
    }
  };

  const isScheduled = status === "SCHEDULED";
  const isModerated = status === "SUSPENDED" || status === "BANNED";

  return (
    <>
      {error && <span className="text-sm text-error">{error}</span>}

      <div className="dropdown dropdown-end">
        <div tabIndex={0} role="button" className="btn btn-outline gap-1.5">
          <MoreVertical className="h-4 w-4" aria-hidden="true" />
          Manage class
        </div>
        <ul
          tabIndex={0}
          aria-label="Manage class"
          className="dropdown-content z-10 mt-2 w-72 rounded-box border border-base-300 bg-base-100 p-1.5 shadow-lg"
        >
          {isModerated ? (
            <li className="px-3 py-2 text-sm text-(--kt-muted)">
              This class is {status.toLowerCase()}, so it can&apos;t be changed. See the notice above to appeal.
            </li>
          ) : (
            <MenuLink href={`/tutor/classes/${classId}/edit`} icon={Pencil} title="Edit class info" note="Topics, sessions, place and size" />
          )}
          {isScheduled && (
            <MenuButton
              onClick={handleTogglePublish}
              disabled={publishing}
              icon={published ? EyeOff : Eye}
              title={published ? "Unpublish class" : "Publish class"}
              note={published ? "Hide it from learners browsing classes" : "Let learners find and join it"}
            />
          )}
          {isScheduled && (
            <>
              <li role="separator" className="my-1.5 border-t border-(--kt-border)" />
              <MenuButton
                onClick={() => setPendingAction("complete")}
                icon={CheckCircle}
                title="Finish class"
                note="Ends it; eligible learners get certificates"
              />
              <MenuButton
                onClick={() => setPendingAction("cancel")}
                icon={XCircle}
                title="Cancel class"
                note="Calls off the remaining sessions"
                danger
              />
              {!hasEnrollments && (
                <MenuButton
                  onClick={() => setPendingAction("delete")}
                  icon={Trash2}
                  title="Delete class"
                  note="Only while no one has enrolled"
                  danger
                />
              )}
            </>
          )}
        </ul>
      </div>

      <ConfirmDialog
        open={pendingAction !== null}
        title={
          pendingAction === "delete"
            ? "Delete this class?"
            : `Mark this class as ${pendingAction === "cancel" ? "cancelled" : "completed"}?`
        }
        description={
          pendingAction === "delete"
            ? "This cannot be undone."
            : pendingAction === "complete"
              ? "Confirm that the class is finished for all currently enrolled learners. Remaining scheduled sessions will be marked completed and each eligible learner will receive a Certificate of Completion."
              : "This will also cancel all remaining scheduled sessions in this class."
        }
        confirmLabel={pendingAction === "delete" ? "Delete" : "Confirm"}
        tone={pendingAction === "delete" || pendingAction === "cancel" ? "danger" : "default"}
        loading={loading}
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      />
    </>
  );
}

type MenuIcon = typeof Pencil;
const itemClass = "flex w-full items-start gap-3 rounded-field px-3 py-2 text-left hover:bg-base-200 focus-visible:bg-base-200 focus-visible:outline-none disabled:opacity-50";

function ItemText({ icon: Icon, title, note, danger }: { icon: MenuIcon; title: string; note: string; danger?: boolean }) {
  return (
    <>
      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${danger ? "text-error" : "text-(--kt-muted)"}`} aria-hidden="true" />
      <span className="min-w-0">
        <span className={`block font-medium ${danger ? "text-error" : ""}`}>{title}</span>
        <span className="block text-sm text-(--kt-muted)">{note}</span>
      </span>
    </>
  );
}

/** A menu row that navigates: title with a one-line note on what it does. */
function MenuLink({ href, ...text }: { href: string; icon: MenuIcon; title: string; note: string }) {
  return (
    <li>
      <Link href={href} className={itemClass}>
        <ItemText {...text} />
      </Link>
    </li>
  );
}

/** A menu row that acts (publish, finish, cancel, delete); `danger` colours the irreversible ones. */
function MenuButton({
  onClick,
  disabled,
  ...text
}: {
  onClick: () => void;
  disabled?: boolean;
  icon: MenuIcon;
  title: string;
  note: string;
  danger?: boolean;
}) {
  return (
    <li>
      <button type="button" onClick={onClick} disabled={disabled} className={itemClass}>
        <ItemText {...text} />
      </button>
    </li>
  );
}

