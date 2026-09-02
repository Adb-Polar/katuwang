"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GradeLevel, SubjectArea } from "@prisma/client";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { SUBJECT_TOPICS } from "@/lib/subjectTopics";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import Pagination from "@/components/ui/Pagination";

const PAGE_SIZE = 10;

interface StudentEnrollment {
  classId: string;
  subject: SubjectArea;
  topics: string[];
  enrolledAt: string;
}

interface Student {
  id: string;
  anonymousId: string;
  gradeLevel: GradeLevel;
  section: string;
  enrollments: StudentEnrollment[];
}

const SUBJECTS = Object.keys(SUBJECT_TOPICS) as SubjectArea[];
const GRADE_LEVELS: GradeLevel[] = [
  "GRADE_7",
  "GRADE_8",
  "GRADE_9",
  "GRADE_10",
  "GRADE_11",
  "GRADE_12",
];

export default function StudentRoster() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [gradeLevel, setGradeLevel] = useState<GradeLevel | "">("");
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState<SubjectArea | "">("");

  const {
    data: students,
    total,
    page,
    setPage,
    loading,
    error,
  } = usePaginatedList<Student>(
    "/api/tutor/students",
    "students",
    {
      ...(q.trim() ? { q: q.trim() } : {}),
      ...(gradeLevel ? { gradeLevel } : {}),
      ...(section.trim() ? { section: section.trim() } : {}),
      ...(subject ? { subject } : {}),
    },
    PAGE_SIZE,
    "Could not retrieve your students."
  );

  return (
    <div className="space-y-4">
      <FeedbackBanner variant="error" message={error || null} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <FormField label="Search">
          <input
            type="text"
            className="input input-bordered input-sm text-xs"
            placeholder="Anonymous ID, e.g. STU-0007"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </FormField>
        <FormField label="Grade Level">
          <select
            className="select select-bordered select-sm text-xs"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value as GradeLevel | "")}
          >
            <option value="">All grades</option>
            {GRADE_LEVELS.map((g) => (
              <option key={g} value={g}>
                {g.replace("_", " ")}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Section">
          <input
            type="text"
            className="input input-bordered input-sm text-xs"
            placeholder="e.g. Rizal"
            value={section}
            onChange={(e) => setSection(e.target.value)}
          />
        </FormField>
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
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <span className="loading loading-spinner loading-md"></span>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-10 bg-base-200/10 border border-dashed border-base-300 rounded-xl text-base-content/40 italic text-xs">
          No students match these filters yet.
        </div>
      ) : (
        <div className="border border-base-200 rounded-xl overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr className="text-2xs">
                <th>Anonymous ID</th>
                <th>Grade &amp; Section</th>
                <th>Enrolled In</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student.id}
                  onClick={() => router.push(`/tutor/students/${student.id}`)}
                  className="cursor-pointer hover:bg-base-200/40"
                >
                  <td>
                    <AnonymousIdBadge id={student.anonymousId} role="LEARNER" />
                  </td>
                  <td className="text-xs text-base-content/70">
                    {student.gradeLevel.replace("_", " ")} · {student.section}
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {student.enrollments.map((enr) => (
                        <span
                          key={enr.classId}
                          className="badge badge-outline badge-sm text-2xs"
                          title={enr.topics.join(", ")}
                        >
                          {enr.subject}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}
