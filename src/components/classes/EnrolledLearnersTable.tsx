"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import { gradeSection } from "@/lib/gradeLevels";

interface Learner {
  id: string;
  anonymousId: string;
  gradeLevel: string;
  section: string;
}

interface Enrollment {
  id: string;
  learner: Learner;
  enrolledAt: string;
}

export default function EnrolledLearnersTable({
  enrollments,
  maxStudents,
}: {
  enrollments: Enrollment[];
  maxStudents: number;
}) {
  const router = useRouter();

  return (
    <>
      <h2 className="card-title text-sm font-bold">
        Enrolled Learners ({enrollments.length} / {maxStudents})
      </h2>

      {enrollments.length === 0 ? (
        <div className="text-center py-6 bg-base-200/10 border border-base-200 rounded-xl text-base-content/40 italic text-xs">
          No learners have enrolled in this class yet.
        </div>
      ) : (
        <div className="border border-base-200 rounded-xl overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr className="text-2xs">
                <th>Anonymous ID</th>
                <th>Grade &amp; Section</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enr) => (
                <tr
                  key={enr.id}
                  onClick={() => router.push(`/tutor/students/${enr.learner.id}`)}
                  className="cursor-pointer hover:bg-base-200/40"
                >
                  <td>
                    <AnonymousIdBadge id={enr.learner.anonymousId} role="LEARNER" />
                  </td>
                  <td className="text-base-content/60">
                    {gradeSection(enr.learner.gradeLevel, enr.learner.section)}
                  </td>
                  <td className="text-right">
                    <ChevronRight className="h-4 w-4 text-base-content/30 inline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
