"use client";

import { useCallback, useEffect, useState } from "react";
import { SUBJECT_TOPICS } from "@/lib/subjectTopics";

type Snapshot = {
  counts: { tutors: number; learners: number; admins: number; classes: number; devUsers: number };
  tutors: { id: string; anonymousId: string; firstName: string; lastName: string; email: string }[];
  learners: { id: string; anonymousId: string; firstName: string; lastName: string; email: string }[];
  classes: {
    id: string;
    code: string;
    subject: string;
    status: string;
    maxStudents: number;
    _count: { enrollments: number };
  }[];
};

const GRADES = ["GRADE_7", "GRADE_8", "GRADE_9", "GRADE_10", "GRADE_11", "GRADE_12"];
const SUBJECTS = Object.keys(SUBJECT_TOPICS);
const ROLES = [
  { value: "STUDENT_LEARNER", label: "Learners" },
  { value: "STUDENT_TUTOR", label: "Tutors" },
  { value: "ADMIN", label: "Admins" },
];

type LogEntry = { ok: boolean; text: string; at: string };

export default function DevDataFactory() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/dev");
      if (!cancelled && res.ok) setSnap(await res.json());
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [version]);

  const run = useCallback(
    async (key: string, payload: Record<string, unknown>) => {
      setBusy(key);
      try {
        const res = await fetch("/api/dev", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        setLog((l) => [
          { ok: res.ok, text: res.ok ? json.message : json.error ?? "Request failed.", at: new Date().toLocaleTimeString() },
          ...l,
        ].slice(0, 30));
        await refresh();
      } catch {
        setLog((l) => [{ ok: false, text: "Network error.", at: new Date().toLocaleTimeString() }, ...l]);
      } finally {
        setBusy(null);
      }
    },
    [refresh],
  );

  // ─── form state ──
  const [uRole, setURole] = useState("STUDENT_LEARNER");
  const [uCount, setUCount] = useState(5);
  const [uGrade, setUGrade] = useState("");
  const [uPending, setUPending] = useState(false);

  const [cTutor, setCTutor] = useState("");
  const [cSubject, setCSubject] = useState(SUBJECTS[0]);
  const [cTopicCount, setCTopicCount] = useState(2);
  const [cSessions, setCSessions] = useState(2);
  const [cMax, setCMax] = useState(3);
  const [cStatus, setCStatus] = useState("SCHEDULED");

  const [eClass, setEClass] = useState("");
  const [eCount, setECount] = useState(1);

  const [trCount, setTrCount] = useState(3);

  return (
    <div className="space-y-4">
      {/* Snapshot */}
      <div className="stats stats-horizontal w-full border border-base-200 bg-base-100 shadow-sm">
        {snap ? (
          <>
            <Stat label="Tutors" value={snap.counts.tutors} />
            <Stat label="Learners" value={snap.counts.learners} />
            <Stat label="Admins" value={snap.counts.admins} />
            <Stat label="Classes" value={snap.counts.classes} />
            <Stat label="@dev.test users" value={snap.counts.devUsers} />
          </>
        ) : (
          <div className="stat">
            <span className="loading loading-spinner loading-sm" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Create users */}
        <Panel title="Create users">
          <Field label="Role">
            <select className="select select-bordered select-sm" value={uRole} onChange={(e) => setURole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="How many (1–50)">
            <input
              type="number"
              min={1}
              max={50}
              className="input input-bordered input-sm"
              value={uCount}
              onChange={(e) => setUCount(Number(e.target.value))}
            />
          </Field>
          <Field label="Grade level">
            <select className="select select-bordered select-sm" value={uGrade} onChange={(e) => setUGrade(e.target.value)}>
              <option value="">Random</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g.replace("GRADE_", "Grade ")}
                </option>
              ))}
            </select>
          </Field>
          {uRole !== "ADMIN" && (
            <label className="flex items-center gap-2 text-2xs font-medium text-base-content/60">
              <input
                type="checkbox"
                className="checkbox checkbox-xs"
                checked={uPending}
                onChange={(e) => setUPending(e.target.checked)}
              />
              Create as PENDING (needs admin approval)
            </label>
          )}
          <ActionButton
            busy={busy === "createUsers"}
            onClick={() =>
              run("createUsers", {
                action: "createUsers",
                role: uRole,
                count: uCount,
                gradeLevel: uGrade || undefined,
                pending: uRole !== "ADMIN" && uPending,
              })
            }
          >
            Create {uCount} {ROLES.find((r) => r.value === uRole)?.label.toLowerCase()}
          </ActionButton>
        </Panel>

        {/* Create class */}
        <Panel title="Create class">
          <Field label="Tutor">
            <select className="select select-bordered select-sm" value={cTutor} onChange={(e) => setCTutor(e.target.value)}>
              <option value="">First / any tutor</option>
              {snap?.tutors.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.anonymousId} — {t.firstName} {t.lastName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Subject">
            <select className="select select-bordered select-sm" value={cSubject} onChange={(e) => setCSubject(e.target.value)}>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Topics">
              <input
                type="number"
                min={1}
                max={6}
                className="input input-bordered input-sm"
                value={cTopicCount}
                onChange={(e) => setCTopicCount(Number(e.target.value))}
              />
            </Field>
            <Field label="Sessions">
              <input
                type="number"
                min={1}
                max={10}
                className="input input-bordered input-sm"
                value={cSessions}
                onChange={(e) => setCSessions(Number(e.target.value))}
              />
            </Field>
            <Field label="Capacity">
              <input
                type="number"
                min={1}
                max={10}
                className="input input-bordered input-sm"
                value={cMax}
                onChange={(e) => setCMax(Number(e.target.value))}
              />
            </Field>
            <Field label="Status">
              <select className="select select-bordered select-sm" value={cStatus} onChange={(e) => setCStatus(e.target.value)}>
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </Field>
          </div>
          <ActionButton
            busy={busy === "createClass"}
            onClick={() =>
              run("createClass", {
                action: "createClass",
                tutorUserId: cTutor || undefined,
                subject: cSubject,
                topicCount: cTopicCount,
                sessionCount: cSessions,
                maxStudents: cMax,
                status: cStatus,
              })
            }
          >
            Create class
          </ActionButton>
        </Panel>

        {/* Enroll */}
        <Panel title="Enrol learners">
          <Field label="Class">
            <select className="select select-bordered select-sm" value={eClass} onChange={(e) => setEClass(e.target.value)}>
              <option value="">Pick a class…</option>
              {snap?.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} · {c.subject} · {c._count.enrollments}/{c.maxStudents} · {c.status}
                </option>
              ))}
            </select>
          </Field>
          <Field label="How many random learners">
            <input
              type="number"
              min={1}
              max={10}
              className="input input-bordered input-sm"
              value={eCount}
              onChange={(e) => setECount(Number(e.target.value))}
            />
          </Field>
          <ActionButton
            busy={busy === "enroll"}
            disabled={!eClass}
            onClick={() => run("enroll", { action: "enroll", classId: eClass, count: eCount })}
          >
            Enrol {eCount} learner(s)
          </ActionButton>
        </Panel>

        {/* Topic requests */}
        <Panel title="Topic requests">
          <Field label="How many (1–40)">
            <input
              type="number"
              min={1}
              max={40}
              className="input input-bordered input-sm"
              value={trCount}
              onChange={(e) => setTrCount(Number(e.target.value))}
            />
          </Field>
          <p className="text-2xs text-base-content/50">
            Open requests from random existing learners, random subject/topics.
          </p>
          <ActionButton
            busy={busy === "createTopicRequests"}
            onClick={() => run("createTopicRequests", { action: "createTopicRequests", count: trCount })}
          >
            Create {trCount} request(s)
          </ActionButton>
        </Panel>
      </div>

      {/* Wipe */}
      <Panel title="Clean up">
        <p className="text-2xs text-base-content/60">
          Deletes every <code className="rounded bg-base-300 px-1">@dev.test</code> account and everything it owns
          (classes, enrolments, requests). Seed accounts are untouched.
        </p>
        <button
          type="button"
          className="btn btn-error btn-sm btn-outline w-fit"
          disabled={busy === "wipeDevData"}
          onClick={() => run("wipeDevData", { action: "wipeDevData" })}
        >
          {busy === "wipeDevData" && <span className="loading loading-spinner loading-xs" />}
          Wipe @dev.test data
        </button>
      </Panel>

      {/* Log */}
      {log.length > 0 && (
        <div className="card border border-base-200 bg-base-100 shadow-sm">
          <div className="card-body gap-1 p-4">
            <h2 className="font-serif text-sm font-semibold">Activity</h2>
            <ul className="space-y-1">
              {log.map((entry, i) => (
                <li key={i} className="flex items-start gap-2 text-2xs">
                  <span className={entry.ok ? "text-success" : "text-error"}>{entry.ok ? "✓" : "✕"}</span>
                  <span className="text-base-content/40">{entry.at}</span>
                  <span className="text-base-content/80">{entry.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat">
      <div className="stat-title text-2xs">{label}</div>
      <div className="stat-value text-2xl">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card border border-base-200 bg-base-100 shadow-sm">
      <div className="card-body gap-3 p-4">
        <h2 className="font-serif text-sm font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-2xs font-medium text-base-content/60">{label}</span>
      {children}
    </label>
  );
}

function ActionButton({
  busy,
  disabled,
  onClick,
  children,
}: {
  busy: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className="btn btn-primary btn-sm w-fit" disabled={busy || disabled} onClick={onClick}>
      {busy && <span className="loading loading-spinner loading-xs" />}
      {children}
    </button>
  );
}
