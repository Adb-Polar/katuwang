"use client";

import ValidatedForm from "@/components/ui/ValidatedForm";
import { reportServerFieldErrors } from "@/lib/formValidation";

import { useState } from "react";
import { ADMIN_PAGE_SIZE } from "@/lib/pagination";
import { Role, GradeLevel } from "@prisma/client";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useTableSort } from "@/hooks/useTableSort";
import SortableTh from "@/components/ui/SortableTh";
import { GRADE_LEVELS, gradeSection } from "@/lib/gradeLevels";
import { formatDateTime } from "@/lib/datetime";
import AnonymousIdText from "@/components/ui/AnonymousIdText";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import Pagination from "@/components/ui/Pagination";
import Tabs from "@/components/ui/Tabs";
import LoadingRow from "@/components/ui/LoadingRow";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import LoadErrorState from "@/components/ui/LoadErrorState";

const PAGE_SIZE = ADMIN_PAGE_SIZE;

const TAB_ROLE: Record<"all" | "learners" | "tutors", string> = {
  all: "",
  learners: "STUDENT_LEARNER",
  tutors: "STUDENT_TUTOR",
};

interface PendingUser {
  id: string;
  anonymousId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  gradeLevel: GradeLevel;
  section: string;
  studentIdNumber: string | null;
  adviserTeacherName: string | null;
  createdAt: string;
}

function StudentRegistrationDetails({ user }: { user: PendingUser }) {
  return (
    <dl className="mt-2 space-y-1 text-sm text-(--kt-muted) whitespace-normal break-words">
      <div><dt className="inline font-medium">Student ID number: </dt><dd className="inline">{user.studentIdNumber?.trim() || "Not provided"}</dd></div>
      <div><dt className="inline font-medium">Adviser teacher: </dt><dd className="inline">{user.adviserTeacherName?.trim() || "Not provided"}</dd></div>
    </dl>
  );
}

export default function RegistrationApprovalTable() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "learners" | "tutors">("all");
  const [gradeFilter, setGradeFilter] = useState<GradeLevel | "">("");
  const [success, setSuccess] = useState("");
  const [declineTarget, setDeclineTarget] = useState<PendingUser | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const { sort, dir, toggle } = useTableSort("createdAt", "asc", { name: "asc", role: "asc", code: "asc" });

  const {
    data: users,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    loading,
    error,
    loadError,
    setError,
    refetch,
  } = usePaginatedList<PendingUser>(
    "/api/admin/registrations",
    "users",
    {
      ...(TAB_ROLE[activeTab] ? { role: TAB_ROLE[activeTab] } : {}),
      ...(gradeFilter ? { gradeLevel: gradeFilter } : {}),
      ...(search.trim() ? { q: search.trim() } : {}),
      sort,
      dir,
    },
    PAGE_SIZE,
    "Could not retrieve pending registrations.",
    "registrations"
  );

  const review = async (user: PendingUser, decision: "APPROVE" | "DECLINE", declineReason = "", validationForm?: HTMLFormElement) => {
    setBusyId(user.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/registrations/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, ...(declineReason ? { reason: declineReason } : {}) }),
      });
      const data = await res.json();
      if (!res.ok && validationForm && reportServerFieldErrors(validationForm, data)) return;
      if (!res.ok) throw new Error(data.error || "Failed to review registration.");

      setSuccess(
        decision === "APPROVE"
          ? `${user.anonymousId} approved — they can now sign in.`
          : `${user.anonymousId} declined.`
      );
      setDeclineTarget(null);
      setReason("");
      refetch();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to review registration.");
    } finally {
      setBusyId(null);
    }
  };

  const openDecline = (user: PendingUser) => {
    setDeclineTarget(user);
    setReason("");
    setError("");
  };

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="success" message={success || null} />
      <FeedbackBanner variant="error" message={declineTarget || loadError ? null : error || null} />

      <section className="card kt-card">
        <div className="card-body gap-4">
          <Tabs
            tabs={[
              { key: "all", label: "All" },
              { key: "learners", label: "Learners" },
              { key: "tutors", label: "Tutors" },
            ]}
            active={activeTab}
            onChange={(key) => setActiveTab(key as "all" | "learners" | "tutors")}
          />

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              aria-label="Search pending registrations"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or ID..."
              className="input input-bordered min-h-11 w-full sm:max-w-xs focus:input-primary"
            />
            <select
              aria-label="Filter registrations by grade"
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value as GradeLevel | "")}
              className="select select-bordered min-h-11 w-full sm:w-auto focus:select-primary"
            >
              <option value="">All grade levels</option>
              {GRADE_LEVELS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <LoadingRow />
          ) : loadError ? (
            <LoadErrorState message={loadError} onRetry={refetch} />
          ) : (
            <>
            <div className="md:hidden">
              {users.map((u) => (
                <article key={u.id} className="min-w-0 space-y-3 border-b border-(--kt-border) py-4 last:border-b-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <AnonymousIdText id={u.anonymousId} role={u.role === "STUDENT_TUTOR" ? "TUTOR" : "LEARNER"} />
                    <span className="text-sm text-(--kt-muted)">{u.role === "STUDENT_TUTOR" ? "Tutor" : "Learner"}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{u.firstName} {u.lastName}</p>
                    <p className="break-all text-sm text-(--kt-muted)">{u.email}</p>
                  </div>
                  <div className="space-y-1 text-sm text-(--kt-muted)">
                    <StudentRegistrationDetails user={u} />
                    <p>{gradeSection(u.gradeLevel, u.section)}</p>
                    <p>Requested {formatDateTime(u.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button type="button" onClick={() => review(u, "APPROVE")} disabled={busyId === u.id} className="btn btn-primary min-h-11 flex-1">{busyId === u.id ? <span className="loading loading-spinner loading-xs" /> : "Approve"}</button>
                    <button type="button" onClick={() => openDecline(u)} disabled={busyId === u.id} className="btn btn-outline btn-error min-h-11 flex-1">Decline</button>
                  </div>
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="table">
                <thead>
                  <tr>
                    <SortableTh label="ID" field="code" sort={sort} dir={dir} onSort={toggle} />
                    <SortableTh label="Name" field="name" sort={sort} dir={dir} onSort={toggle} />
                    <th>Email</th>
                    <SortableTh label="Role" field="role" sort={sort} dir={dir} onSort={toggle} />
                    <th>Grade &amp; section</th>
                    <SortableTh label="Requested" field="createdAt" sort={sort} dir={dir} onSort={toggle} />
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <AnonymousIdText
                          id={u.anonymousId}
                          role={u.role === "STUDENT_TUTOR" ? "TUTOR" : "LEARNER"}
                        />
                      </td>
                      <td>
                        <span className="font-medium">{u.firstName} {u.lastName}</span>
                        <StudentRegistrationDetails user={u} />
                      </td>
                      <td className="text-(--kt-muted)">{u.email}</td>
                      <td className="text-(--kt-muted)">
                        {u.role === "STUDENT_TUTOR" ? "Tutor" : "Learner"}
                      </td>
                      <td className="text-(--kt-muted)">
                        {gradeSection(u.gradeLevel, u.section)}
                      </td>
                      <td className="text-sm text-(--kt-muted)">{formatDateTime(u.createdAt)}</td>
                      <td>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => review(u, "APPROVE")}
                            disabled={busyId === u.id}
                            className="btn btn-primary min-h-11"
                          >
                            {busyId === u.id ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              "Approve"
                            )}
                          </button>
                          <button
                            onClick={() => openDecline(u)}
                            disabled={busyId === u.id}
                            className="btn btn-outline btn-error min-h-11"
                          >
                            Decline
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {users.length === 0 && <EmptyState>No accounts awaiting approval.</EmptyState>}
            </>
          )}

          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </section>

      <Modal open={declineTarget !== null} onClose={() => setDeclineTarget(null)} title="Decline registration">
        {declineTarget && <ValidatedForm onSubmit={(e) => { e.preventDefault(); void review(declineTarget, "DECLINE", reason, e.currentTarget); }}>
            <p className="text-sm text-(--kt-muted) mb-4">
              <AnonymousIdText id={declineTarget.anonymousId} role={declineTarget.role === "STUDENT_TUTOR" ? "TUTOR" : "LEARNER"} /> · {declineTarget.firstName} {declineTarget.lastName}
            </p>

            <FeedbackBanner variant="error" message={error || null} />

            <FormField label="Reason" hint="Optional — stored on the account and in the audit log" size="md">
              <textarea
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this registration being declined?"
                className="textarea textarea-bordered w-full focus:textarea-primary h-24"
              />
            </FormField>

            <div className="modal-action pt-4">
              <button
                type="button"
                onClick={() => setDeclineTarget(null)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button type="submit"
                disabled={busyId === declineTarget.id}
                className="btn btn-error"
              >
                {busyId === declineTarget.id ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  "Decline"
                )}
              </button>
            </div>
        </ValidatedForm>}
      </Modal>
    </div>
  );
}
