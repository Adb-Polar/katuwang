"use client";

import { useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export type DevUser = {
  id: string;
  anonymousId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMIN" | "STUDENT_TUTOR" | "STUDENT_LEARNER";
  status: "ACTIVE" | "SUSPENDED" | "BANNED" | "PENDING";
  gradeLevel: string;
  section: string;
};

const PAGE_SIZE = 8;

export default function DevLoginBoard({
  title,
  tone,
  users,
  password,
}: {
  title: string;
  tone: string;
  users: DevUser[];
  password: string;
}) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.anonymousId.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q),
    );
  }, [users, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const slice = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  async function loginAs(u: DevUser) {
    setBusy(u.id);
    setError("");
    const result = await signIn("credentials", {
      email: u.email,
      password,
      redirect: false,
    });
    if (result?.error) {
      setError(`${u.anonymousId}: ${result.error}`);
      setBusy(null);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="card border border-base-200 bg-base-100 shadow-sm">
      <div className="card-body gap-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-sm font-semibold">
            {title} <span className="text-base-content/40">({filtered.length})</span>
          </h2>
          <span className={`badge badge-sm ${tone}`}>{title}</span>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder="Search name / ID / email"
          className="input input-bordered input-xs w-full text-xs"
        />

        {error && <p className="text-2xs text-error">{error}</p>}

        <ul className="divide-y divide-base-200">
          {slice.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => loginAs(u)}
                className="flex w-full flex-col items-start gap-0.5 py-2 text-left hover:bg-base-200 disabled:opacity-50"
              >
                <span className="flex w-full items-center justify-between">
                  <span className="font-mono text-xs font-semibold">{u.anonymousId}</span>
                  {u.status !== "ACTIVE" && (
                    <span className="badge badge-ghost badge-xs">{u.status}</span>
                  )}
                  {busy === u.id && <span className="loading loading-spinner loading-xs" />}
                </span>
                <span className="text-2xs text-base-content/70">
                  {u.firstName} {u.lastName}
                </span>
                <span className="text-2xs text-base-content/40">{u.email}</span>
                <span className="text-2xs text-base-content/40">
                  {u.gradeLevel} · {u.section}
                </span>
              </button>
            </li>
          ))}
          {slice.length === 0 && (
            <li className="py-4 text-center text-2xs text-base-content/40">No accounts</li>
          )}
        </ul>

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            Prev
          </button>
          <span className="text-2xs text-base-content/50">
            Page {current + 1} / {pageCount}
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            disabled={current >= pageCount - 1}
            onClick={() => setPage(current + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
