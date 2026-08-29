"use client";

import { useState } from "react";
import { SubjectArea } from "@prisma/client";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { SUBJECT_TOPICS } from "@/lib/subjectTopics";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import Pagination from "@/components/ui/Pagination";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import FulfillRequestModal from "@/components/tutor/FulfillRequestModal";

const PAGE_SIZE = 10;
const SUBJECTS = Object.keys(SUBJECT_TOPICS) as SubjectArea[];

interface TutorTopicRequest {
  id: string;
  subject: string;
  gradeLevel: string;
  note: string | null;
  createdAt: string;
  topics: string[];
  slots: { day: string; startTime: string; endTime: string }[];
  learner: { anonymousId: string; gradeLevel: string; section: string };
}

export default function TopicRequestQueue() {
  const [subject, setSubject] = useState<SubjectArea | "">("");
  const [onlyMine, setOnlyMine] = useState(true);
  const [fulfilling, setFulfilling] = useState<{ id: string; subject: string } | null>(null);

  const { data: requests, total, page, setPage, loading, error, refetch } =
    usePaginatedList<TutorTopicRequest>(
      "/api/tutor/topic-requests",
      "requests",
      {
        ...(subject ? { subject } : {}),
        mine: onlyMine ? "true" : "false",
      },
      PAGE_SIZE,
      "Could not load topic requests."
    );

  return (
    <div className="space-y-4">
      <FeedbackBanner variant="error" message={error || null} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FormField label="Subject">
          <select
            className="select select-bordered select-sm text-xs"
            value={subject}
            onChange={(e) => setSubject(e.target.value as SubjectArea | "")}
          >
            <option value="">All subjects</option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Scope">
          <label className="flex items-center gap-2 text-xs cursor-pointer h-8">
            <input
              type="checkbox"
              className="checkbox checkbox-xs checkbox-primary"
              checked={onlyMine}
              disabled={subject !== ""}
              onChange={(e) => setOnlyMine(e.target.checked)}
            />
            Only subjects I teach
          </label>
        </FormField>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <span className="loading loading-spinner loading-md" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-10 bg-base-200/10 border border-dashed border-base-300 rounded-xl text-base-content/40 italic text-xs">
          No open requests match these filters.
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="border border-base-200 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="badge badge-neutral text-2xs font-bold uppercase tracking-wide px-2 py-2">
                    {r.subject}
                  </span>
                  <AnonymousIdBadge id={r.learner.anonymousId} role="LEARNER" />
                  <span className="text-base-content/50">
                    {r.learner.gradeLevel.replace("_", " ")} · {r.learner.section}
                  </span>
                </div>
                <button
                  onClick={() => setFulfilling({ id: r.id, subject: r.subject })}
                  className="btn btn-primary btn-xs text-2xs"
                >
                  Offer a class
                </button>
              </div>

              <div className="flex flex-wrap gap-1">
                {r.topics.map((t) => (
                  <span key={t} className="badge badge-outline badge-sm text-2xs py-2.5">
                    {t}
                  </span>
                ))}
              </div>

              {r.slots.length > 0 && (
                <p className="text-2xs text-base-content/60">
                  Prefers:{" "}
                  {r.slots
                    .map((s) => `${s.day[0] + s.day.slice(1).toLowerCase()} ${s.startTime}–${s.endTime}`)
                    .join(", ")}
                </p>
              )}

              {r.note && <p className="text-base-content/60 italic">“{r.note}”</p>}

              <p className="text-2xs text-base-content/40">
                Requested {new Date(r.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />

      {fulfilling && (
        <FulfillRequestModal
          requestId={fulfilling.id}
          subject={fulfilling.subject}
          onClose={() => setFulfilling(null)}
          onFulfilled={() => {
            setFulfilling(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
