"use client";

import { useState } from "react";
import { SubjectArea } from "@prisma/client";
import StatusBadge from "@/components/ui/StatusBadge";
import FeedbackBanner from "@/components/ui/FeedbackBanner";

export interface TaughtTopic {
  subject: SubjectArea;
  topic: string;
}

export interface TopicCertificationEntry {
  subject: SubjectArea;
  topic: string;
  status: "PENDING" | "CERTIFIED";
}

function keyOf(subject: string, topic: string) {
  return `${subject}::${topic}`;
}

export default function TopicCertificationList({
  taughtTopics,
  initialCertifications,
}: {
  taughtTopics: TaughtTopic[];
  initialCertifications: TopicCertificationEntry[];
}) {
  const [certifications, setCertifications] = useState<Map<string, TopicCertificationEntry["status"]>>(
    () => new Map(initialCertifications.map((c) => [keyOf(c.subject, c.topic), c.status]))
  );
  const [requesting, setRequesting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleRequest = async (subject: SubjectArea, topic: string) => {
    const key = keyOf(subject, topic);
    setRequesting(key);
    setError("");
    try {
      const res = await fetch("/api/tutor/topic-certifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to request assessment.");
      setCertifications((prev) => new Map(prev).set(key, data.status));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request assessment.");
    } finally {
      setRequesting(null);
    }
  };

  if (taughtTopics.length === 0) {
    return (
      <p className="text-2xs text-base-content/50 italic border border-dashed border-base-300 rounded-lg py-4 text-center">
        Schedule your first class to see topics you can request an assessment for.
      </p>
    );
  }

  return (
    <div className="space-y-3 mt-1">
      <FeedbackBanner variant="error" message={error || null} />
      {taughtTopics.map(({ subject, topic }) => {
        const key = keyOf(subject, topic);
        const status = certifications.get(key);

        return (
          <div
            key={key}
            className="flex items-center justify-between p-3 border border-base-200 bg-base-200/20 rounded-xl text-xs gap-3"
          >
            <div className="min-w-0">
              <div className="font-semibold text-base-content/80 truncate">{topic}</div>
              <div className="text-2xs text-base-content/50">{subject}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {status === "CERTIFIED" ? (
                <StatusBadge tone="success" label="Verified" size="xs" />
              ) : status === "PENDING" ? (
                <StatusBadge tone="warning" label="Assessment Pending" size="xs" />
              ) : (
                <button
                  onClick={() => handleRequest(subject, topic)}
                  disabled={requesting === key}
                  className="btn btn-outline btn-primary btn-xs text-2xs font-bold cursor-pointer"
                >
                  {requesting === key ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    "Request Assessment"
                  )}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
