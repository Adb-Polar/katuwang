import Link from "next/link";
import { ChevronRight } from "lucide-react";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";

/** The tutor's anonymized ID badge, linking to their full profile page. */
export default function TutorInfoTrigger({
  tutorId,
  anonymousId,
}: {
  tutorId: string;
  anonymousId: string;
}) {
  return (
    <Link
      href={`/learner/tutors/${tutorId}`}
      className="inline-flex items-center gap-0.5 hover:opacity-80 transition-opacity"
    >
      <AnonymousIdBadge id={anonymousId} role="TUTOR" />
      <ChevronRight className="h-3.5 w-3.5 text-base-content/40" />
    </Link>
  );
}
