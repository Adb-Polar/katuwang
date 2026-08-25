import { useCallback, useState } from "react";
import { SubjectArea } from "@prisma/client";
import { useFetchList } from "./useFetchList";

export interface TopicCertification {
  id: string;
  tutorProfileId: string;
  subject: SubjectArea;
  topic: string;
  status: "PENDING" | "CERTIFIED";
  requestedAt: string;
  certifiedAt: string | null;
}

export function useTopicCertifications() {
  const { data, loading, error, setError, refetch } = useFetchList<TopicCertification>(
    "/api/tutor/topic-certifications",
    "Could not retrieve topic certifications."
  );
  const [requesting, setRequesting] = useState<string | null>(null);

  const statusFor = useCallback(
    (subject: SubjectArea, topic: string) => data.find((c) => c.subject === subject && c.topic === topic)?.status,
    [data]
  );

  const requestAssessment = useCallback(
    async (subject: SubjectArea, topic: string) => {
      const key = `${subject}:${topic}`;
      setRequesting(key);
      try {
        const res = await fetch("/api/tutor/topic-certifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject, topic }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to request assessment.");
        refetch();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to request assessment.");
      } finally {
        setRequesting(null);
      }
    },
    [refetch, setError]
  );

  return { certifications: data, loading, error, setError, refetch, statusFor, requestAssessment, requesting };
}
