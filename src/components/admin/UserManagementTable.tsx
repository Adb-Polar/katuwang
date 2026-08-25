"use client";

import { useState } from "react";
import { Role, GradeLevel, AccountStatus } from "@prisma/client";
import { useFetchList } from "@/hooks/useFetchList";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import Tabs from "@/components/ui/Tabs";

interface AdminUser {
  id: string;
  anonymousId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  gradeLevel: GradeLevel;
  section: string;
  status: AccountStatus;
  statusReason: string | null;
  statusUpdatedAt: string | null;
}

const STATUS_TONE: Record<AccountStatus, "success" | "warning" | "error"> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  BANNED: "error",
};

export default function UserManagementTable() {
  const { data: users, loading, error, setError, refetch } = useFetchList<AdminUser>(
    "/api/admin/users",
    "Could not retrieve users."
  );
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "learners" | "tutors">("all");
  const [target, setTarget] = useState<AdminUser | null>(null);
  const [status, setStatus] = useState<AccountStatus>("ACTIVE");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const learners = users.filter((u) => u.role === "STUDENT_LEARNER");
  const tutors = users.filter((u) => u.role === "STUDENT_TUTOR");
  const displayed = activeTab === "learners" ? learners : activeTab === "tutors" ? tutors : users;

  const openModal = (user: AdminUser) => {
    setTarget(user);
    setStatus(user.status);
    setReason("");
    setError("");
  };

  const handleSave = async () => {
    if (!target) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update account.");

      setSuccess(`${target.anonymousId} is now ${status}.`);
      setTarget(null);
      refetch();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update account.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="success" message={success || null} />
      <FeedbackBanner variant="error" message={target ? null : error || null} />

      <section className="card bg-base-100 shadow-md border border-base-200">
        <div className="card-body gap-4">
          <h2 className="card-title text-sm font-bold">Learner & Tutor Accounts</h2>

          <Tabs
            tabs={[
              { key: "all", label: "All", count: users.length },
              { key: "learners", label: "Learners", count: learners.length },
              { key: "tutors", label: "Tutors", count: tutors.length },
            ]}
            active={activeTab}
            onChange={(key) => setActiveTab(key as "all" | "learners" | "tutors")}
          />

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
          ) : (
            <div className="overflow-x-auto border border-base-200 rounded-xl">
              <table className="table table-sm">
                <thead>
                  <tr className="text-2xs">
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Grade &amp; Section</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((u) => (
                    <tr key={u.id} className="text-xs">
                      <td>
                        <AnonymousIdBadge
                          id={u.anonymousId}
                          role={u.role === "STUDENT_TUTOR" ? "TUTOR" : "LEARNER"}
                        />
                      </td>
                      <td className="text-base-content/70">
                        {u.firstName} {u.lastName}
                      </td>
                      <td className="text-base-content/60">{u.email}</td>
                      <td className="text-base-content/60">
                        {u.gradeLevel.replace("_", " ")} · {u.section}
                      </td>
                      <td>
                        <StatusBadge tone={STATUS_TONE[u.status]} label={u.status} size="xs" />
                      </td>
                      <td>
                        <button
                          onClick={() => openModal(u)}
                          className="btn btn-outline btn-primary btn-xs text-2xs font-bold cursor-pointer"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {displayed.length === 0 && (
                <div className="text-center py-8 text-base-content/40 italic text-xs">No accounts found.</div>
              )}
            </div>
          )}
        </div>
      </section>

      {target && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm p-6 bg-base-100 border border-base-200 rounded-2xl relative shadow-xl">
            <button
              onClick={() => setTarget(null)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            >
              ✕
            </button>
            <h3 className="font-serif text-base font-semibold mb-1">Manage Account</h3>
            <p className="text-2xs text-base-content/50 mb-4">
              {target.anonymousId} · {target.firstName} {target.lastName}
            </p>

            <FeedbackBanner variant="error" message={error || null} />

            <div className="space-y-3.5">
              <FormField label="Status" required>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AccountStatus)}
                  className="select select-bordered select-sm w-full focus:select-primary text-xs"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="BANNED">Banned</option>
                </select>
              </FormField>

              <FormField label="Reason" hint="Optional — shown for your own records">
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why is this account's status changing?"
                  className="textarea textarea-bordered textarea-sm w-full focus:textarea-primary text-xs h-20"
                />
              </FormField>
            </div>

            <div className="modal-action pt-4">
              <button
                type="button"
                onClick={() => setTarget(null)}
                className="btn btn-neutral btn-outline btn-sm text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary btn-sm text-xs cursor-pointer"
              >
                {saving ? <span className="loading loading-spinner loading-xs"></span> : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
