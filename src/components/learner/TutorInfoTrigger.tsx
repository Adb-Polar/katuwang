import Link from "next/link";

/**
 * The tutor's identity, linking to their profile page: the anonymous ID in serif ube, or — when the
 * `showTutorRealNames` setting is on — the real name followed by the ID and section.
 */
export default function TutorInfoTrigger({
  tutorId,
  anonymousId,
  name,
  section,
}: {
  tutorId: string;
  anonymousId: string;
  name?: string | null;
  section?: string | null;
}) {
  return (
    <Link href={`/learner/tutors/${tutorId}`} className="link link-hover">
      {name && <span className="text-base-content">{name} </span>}
      <span className="kt-id kt-id--tutor">{anonymousId}</span>
      {name && section && <span> · Section {section}</span>}
    </Link>
  );
}
