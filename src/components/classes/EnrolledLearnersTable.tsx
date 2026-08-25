import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";

interface Learner {
  id: string;
  anonymousId: string;
  firstName: string;
  lastName: string;
  gradeLevel: string;
  section: string;
}

interface Enrollment {
  id: string;
  learner: Learner;
}

export default function EnrolledLearnersTable({
  enrollments,
  maxStudents,
}: {
  enrollments: Enrollment[];
  maxStudents: number;
}) {
  return (
    <div className="space-y-2">
      <div className="font-bold text-base-content/50 text-2xs uppercase">
        Enrolled Learners ({enrollments.length} / {maxStudents})
      </div>

      {enrollments.length === 0 ? (
        <div className="text-center py-6 bg-base-200/10 border border-base-200 rounded-xl text-base-content/40 italic">
          No learners have enrolled in this class yet.
        </div>
      ) : (
        <div className="max-h-40 overflow-y-auto border border-base-200 rounded-xl">
          <table className="table table-xs">
            <thead>
              <tr className="text-2xs">
                <th>Anonymous ID</th>
                <th>Name</th>
                <th>Grade &amp; Section</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enr) => (
                <tr key={enr.id}>
                  <td>
                    <AnonymousIdBadge id={enr.learner.anonymousId} role="LEARNER" />
                  </td>
                  <td className="text-base-content/60">
                    {enr.learner.firstName} {enr.learner.lastName}
                  </td>
                  <td className="text-base-content/60">
                    {enr.learner.gradeLevel.replace("_", " ")} · {enr.learner.section}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
