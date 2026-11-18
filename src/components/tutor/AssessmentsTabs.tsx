"use client";

import { useState } from "react";
import Tabs from "@/components/ui/Tabs";
import TopicCertificationList, {
  TaughtTopic,
  TopicCertificationEntry,
} from "@/components/tutor/TopicCertificationList";
import AssessmentHistory, { CertificationDetail } from "@/components/tutor/AssessmentHistory";
import OtherTopicAssessment from "@/components/tutor/OtherTopicAssessment";
import type { TopicAssessmentStatus } from "@/lib/assessmentStatus";
import type { AttemptSummary } from "@/app/tutor/assessments/page";

export default function AssessmentsTabs({
  taughtTopics,
  initialCertifications,
  certificationDetails,
  topicStatuses,
  attempts,
}: {
  taughtTopics: TaughtTopic[];
  initialCertifications: TopicCertificationEntry[];
  certificationDetails: CertificationDetail[];
  topicStatuses: Record<string, TopicAssessmentStatus>;
  attempts: AttemptSummary[];
}) {
  const [activeTab, setActiveTab] = useState<"topics" | "history">("topics");
  // Lifted so a "Request questions" click survives switching to the History tab
  // and back — TopicCertificationList unmounts on tab change and would otherwise
  // lose its local state until a full page refresh.
  const [requested, setRequested] = useState<Set<string>>(new Set());

  return (
    <div className="flex flex-col gap-5">
      <Tabs
        tabs={[
          { key: "topics", label: "Topics", count: taughtTopics.length },
          { key: "history", label: "History", count: attempts.length },
        ]}
        active={activeTab}
        onChange={(key) => setActiveTab(key as "topics" | "history")}
      />

      {activeTab === "topics" ? (
        <>
          <TopicCertificationList
            taughtTopics={taughtTopics}
            initialCertifications={initialCertifications}
            topicStatuses={topicStatuses}
            requested={requested}
            onRequested={(key) => setRequested((prev) => new Set(prev).add(key))}
          />
          <OtherTopicAssessment />
        </>
      ) : (
        <AssessmentHistory certifications={certificationDetails} attempts={attempts} />
      )}
    </div>
  );
}
