import StatusBadge from "@/components/ui/StatusBadge";

export interface CertificationDetail {
  id: string;
  subject: string;
  topic: string;
  status: "PENDING" | "CERTIFIED";
  requestedAt: string;
  certifiedAt: string | null;
  usedInClasses: { id: string; subject: string; status: string }[];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AssessmentHistory({ certifications }: { certifications: CertificationDetail[] }) {
  if (certifications.length === 0) {
    return (
      <p className="text-2xs text-base-content/50 italic border border-dashed border-base-300 rounded-lg py-4 text-center">
        You haven&apos;t requested any topic assessments yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {certifications.map((c) => (
        <div key={c.id} className="border border-base-200 rounded-xl p-3 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold text-xs text-base-content/80 truncate">{c.topic}</div>
              <div className="text-2xs text-base-content/50">{c.subject}</div>
            </div>
            <StatusBadge
              tone={c.status === "CERTIFIED" ? "success" : "warning"}
              label={c.status === "CERTIFIED" ? "Verified" : "Assessment Pending"}
              size="xs"
            />
          </div>

          <div className="text-2xs text-base-content/50 flex flex-wrap gap-x-4 gap-y-1">
            <span>Requested {formatDate(c.requestedAt)}</span>
            {c.certifiedAt && <span>Certified {formatDate(c.certifiedAt)}</span>}
          </div>

          {c.usedInClasses.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {c.usedInClasses.map((cls) => (
                <span key={cls.id} className="badge badge-outline badge-sm text-2xs">
                  {cls.status}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
