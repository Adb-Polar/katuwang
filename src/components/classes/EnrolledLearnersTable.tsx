"use client";

import Link from "next/link";
import { gradeSection } from "@/lib/gradeLevels";

interface Learner {
  id: string;
  anonymousId: string;
  image?: string | null;
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
  return (
    <>
      <h2 className="font-serif text-xl font-medium">
        Enrolled learners <span className="text-(--kt-muted) text-base">{enrollments.length} of {maxStudents}</span>
      </h2>

      {enrollments.length === 0 ? (
        <p className="py-3 text-sm text-(--kt-muted)">
          No learners have enrolled in this class yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Anonymous ID</th>
                <th>Grade &amp; section</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enr) => (
                <tr key={enr.id}>
                  <td>
                    <Link href={`/tutor/students/${enr.learner.id}`} aria-label={`View ${enr.learner.anonymousId} details`} className="link link-hover kt-id kt-id--learner">
                      {enr.learner.anonymousId}
                    </Link>
                  </td>
                  <td className="text-(--kt-muted)">
                    {gradeSection(enr.learner.gradeLevel, enr.learner.section)}
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
