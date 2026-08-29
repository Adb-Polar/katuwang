"use client";

import { useState } from "react";
import Tabs from "@/components/ui/Tabs";
import TopicCertificationList, { TaughtTopic, TopicCertificationEntry } from "@/components/tutor/TopicCertificationList";
import AssessmentHistory, { CertificationDetail } from "@/components/tutor/AssessmentHistory";

export default function AssessmentsTabs({
  taughtTopics,
  initialCertifications,
  certificationDetails,
}: {
  taughtTopics: TaughtTopic[];
  initialCertifications: TopicCertificationEntry[];
  certificationDetails: CertificationDetail[];
}) {
  const [activeTab, setActiveTab] = useState<"topics" | "history">("topics");

  return (
    <section className="card bg-base-100 shadow-md border border-base-200">
      <div className="card-body gap-4">
        <Tabs
          tabs={[
            { key: "topics", label: "Topics You Teach", count: taughtTopics.length },
            { key: "history", label: "Request History", count: certificationDetails.length },
          ]}
          active={activeTab}
          onChange={(key) => setActiveTab(key as "topics" | "history")}
        />

        {activeTab === "topics" ? (
          <>
            <p className="text-xs text-base-content/60">
              Once you&apos;re teaching a topic, you can request an assessment for it. Passing verifies your
              knowledge with a badge learners can see — assessment grading is rolling out, so requests may stay
              pending for a while.
            </p>
            <TopicCertificationList taughtTopics={taughtTopics} initialCertifications={initialCertifications} />
          </>
        ) : (
          <AssessmentHistory certifications={certificationDetails} />
        )}
      </div>
    </section>
  );
}
