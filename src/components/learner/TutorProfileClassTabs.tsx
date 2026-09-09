"use client";

import { useState } from "react";
import ClassCard from "@/components/classes/ClassCard";
import Tabs from "@/components/ui/Tabs";
import type { ClassLifecycleStatus } from "@/components/classes/classStatus";
import type { GradeLevel } from "@prisma/client";

export interface TutorProfileClass {
  id: string;
  code: string;
  subject: string;
  gradeLevel: GradeLevel | null;
  topics: string[];
  verifiedTopics: string[];
  description: string | null;
  sessions: { scheduledAt: string; duration: number; status: "SCHEDULED" | "COMPLETED" | "CANCELLED" }[];
  status: ClassLifecycleStatus;
  enrolledCount: number;
  maxStudents: number;
}

function Grid({ classes, emptyHint }: { classes: TutorProfileClass[]; emptyHint: string }) {
  if (classes.length === 0) {
    return (
      <p className="text-xs text-base-content/50 italic border border-dashed border-base-300 rounded-lg py-6 text-center">
        {emptyHint}
      </p>
    );
  }
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {classes.map((c) => (
        <ClassCard
          key={c.id}
          code={c.code}
          subject={c.subject}
          gradeLevel={c.gradeLevel}
          topics={c.topics}
          verifiedTopics={c.verifiedTopics}
          description={c.description}
          sessions={c.sessions}
          status={c.status}
          enrolledCount={c.enrolledCount}
          maxStudents={c.maxStudents}
          activeLabel="Open"
          href={`/learner/classes/${c.id}`}
        />
      ))}
    </div>
  );
}

/**
 * The class list on a tutor's public profile. "Completed" classes get their own
 * tab and are only ever passed in for a learner enrolled in them — a stranger
 * never sees the tab at all.
 */
export default function TutorProfileClassTabs({
  active,
  completed,
}: {
  active: TutorProfileClass[];
  completed: TutorProfileClass[];
}) {
  const [tab, setTab] = useState<"active" | "completed">("active");
  const hasCompleted = completed.length > 0;
  const current = tab === "completed" && hasCompleted ? "completed" : "active";

  return (
    <div className="space-y-3">
      {hasCompleted && (
        <Tabs
          tabs={[
            { key: "active", label: "Classes", count: active.length },
            { key: "completed", label: "Completed", count: completed.length },
          ]}
          active={current}
          onChange={(k) => setTab(k as "active" | "completed")}
        />
      )}
      {current === "completed" ? (
        <Grid classes={completed} emptyHint="No completed classes." />
      ) : (
        <Grid classes={active} emptyHint="This tutor has no published classes right now." />
      )}
    </div>
  );
}
