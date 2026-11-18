"use client";

import { useState } from "react";
import { ADMIN_PAGE_SIZE } from "@/lib/pagination";
import Link from "next/link";
import { GradeLevel } from "@prisma/client";
import { gradeLabel, gradeNumber } from "@/lib/gradeLevels";
import { subjectDisplayLabel } from "@/lib/displayLabels";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import FormField from "@/components/ui/FormField";
import Pagination from "@/components/ui/Pagination";

import UserAvatar from "@/components/profile/UserAvatar";
import LoadErrorState from "@/components/ui/LoadErrorState";

const PAGE_SIZE = ADMIN_PAGE_SIZE;

interface StudentEnrollment {
  classId: string;
  code: string;
  subject: string;
  topics: string[];
  enrolledAt: string;
  withdrawnAt?: string | null;
}

interface Student {
  id: string;
  anonymousId: string;
  image?: string | null;
  gradeLevel: GradeLevel;
  section: string;
  enrollments: StudentEnrollment[];
}

interface EnrolledClass {
  id: string;
  code: string;
  subject: string;
}

const GRADE_LEVELS: GradeLevel[] = [
  "GRADE_7",
  "GRADE_8",
  "GRADE_9",
  "GRADE_10",
  "GRADE_11",
  "GRADE_12",
];

export default function StudentRoster() {
  const [q, setQ] = useState("");
  const [gradeLevel, setGradeLevel] = useState<GradeLevel | "">("");
  const [section, setSection] = useState("");
  const [classId, setClassId] = useState("");

  const {
    data: students,
    total,
    meta,
    page,
    setPage,
    loading,
    loadError,
    refetch,
  } = usePaginatedList<Student>(
    "/api/tutor/students",
    "students",
    {
      ...(q.trim() ? { q: q.trim() } : {}),
      ...(gradeLevel ? { gradeLevel } : {}),
      ...(section.trim() ? { section: section.trim() } : {}),
      ...(classId ? { classId } : {}),
    },
    PAGE_SIZE,
    "Could not retrieve your students."
  );
  const classes = (meta.classes ?? []) as EnrolledClass[];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <FormField size="md" label="Search">
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="Learner ID, e.g. STU-0007"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </FormField>
        <FormField size="md" label="Grade level">
          <select
            className="select select-bordered w-full"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value as GradeLevel | "")}
          >
            <option value="">All grades</option>
            {GRADE_LEVELS.map((g) => (
              <option key={g} value={g}>
                {gradeLabel(g)}
              </option>
            ))}
          </select>
        </FormField>
        <FormField size="md" label="Section">
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="e.g. Rizal"
            value={section}
            onChange={(e) => setSection(e.target.value)}
          />
        </FormField>
        <FormField size="md" label="Class">
          <select
            className="select select-bordered w-full"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            <option value="">All classes</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.code} — {subjectDisplayLabel(item.subject)}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {loading ? (
        <p role="status" className="text-(--kt-muted)">Loading students…</p>
      ) : loadError ? (
        <LoadErrorState message={loadError} onRetry={refetch} />
      ) : students.length === 0 ? (
        <p className="kt-card px-5 py-6">No students match these filters yet.</p>
      ) : (
        <section aria-label="Students" className="kt-card">
          <p className="px-5 py-3 border-b border-(--kt-border) text-sm text-(--kt-muted)">
            {total} student{total === 1 ? "" : "s"}
          </p>
          <ul>
            {students.map((student) => (
              <li
                key={student.id}
                className="grid gap-x-6 gap-y-3 px-5 py-4 border-b border-(--kt-border) last:border-b-0 sm:grid-cols-[15rem_1fr]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar
                    src={student.image}
                    anonymousId={student.anonymousId}
                    size="md"
                    role="LEARNER"
                    subtitle={studentLine(student)}
                  />
                  <div className="min-w-0">
                    <Link
                      href={`/tutor/students/${student.id}`}
                      aria-label={`View ${student.anonymousId} details`}
                      className="kt-id kt-id--learner text-lg hover:underline"
                    >
                      {student.anonymousId}
                    </Link>
                    <p className="text-sm text-(--kt-muted)">{studentLine(student)}</p>
                  </div>
                </div>

                <ul aria-label={`${student.anonymousId}'s classes`} className="flex flex-col gap-1.5 min-w-0">
                  {student.enrollments.map((enr) => (
                    <li key={enr.classId} className={`leading-snug ${enr.withdrawnAt ? "text-(--kt-muted)" : ""}`}>
                      <Link href={`/tutor/classes/${enr.classId}`} className="hover:underline">
                        {enr.topics[0] ?? subjectDisplayLabel(enr.subject)}
                      </Link>
                      {[subjectDisplayLabel(enr.subject), enr.code, enr.withdrawnAt && "withdrawn"]
                        .filter(Boolean)
                        .map((part, i) => (
                          <span key={i} className="text-sm text-(--kt-muted)">
                            {" · "}
                            <span className="whitespace-nowrap">{part}</span>
                          </span>
                        ))}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}

/** "Grade 8 · Section Rizal" */
function studentLine(student: Student): string {
  return `Grade ${gradeNumber(student.gradeLevel)} · Section ${student.section}`;
}
