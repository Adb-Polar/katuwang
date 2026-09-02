"use client";

import { useState } from "react";
import Tabs from "@/components/ui/Tabs";
import TopicCertificationList, {
  TaughtTopic,
  TopicCertificationEntry,
} from "@/components/tutor/TopicCertificationList";
import AssessmentHistory, { CertificationDetail } from "@/components/tutor/AssessmentHistory";
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

  return (
    <section className="card kt-card">
      <div className="card-body gap-4">
        <Tabs
          tabs={[
            { key: "topics", label: "Topics You Teach", count: taughtTopics.length },
            { key: "history", label: "Assessment History", count: attempts.length },
          ]}
          active={activeTab}
          onChange={(key) => setActiveTab(key as "topics" | "history")}
        />

        {activeTab === "topics" ? (
          <>
            <p className="text-xs text-base-content/60">
              Once you&apos;re teaching a topic, take its assessment to earn a verified badge learners can
              see. If a topic has no assessment yet, you can ask an admin to add questions for it.
            </p>
            <TopicCertificationList
              taughtTopics={taughtTopics}
              initialCertifications={initialCertifications}
              topicStatuses={topicStatuses}
            />
          </>
        ) : (
          <AssessmentHistory certifications={certificationDetails} attempts={attempts} />
        )}
      </div>
    </section>
  );
}
