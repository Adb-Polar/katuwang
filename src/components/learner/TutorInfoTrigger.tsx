import Link from "next/link";
import { ChevronRight } from "lucide-react";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import UserAvatar from "@/components/profile/UserAvatar";

/**
 * The tutor's identity, linking to their full profile page. Shows the anonymized
 * ID badge by default; when `name` is provided (i.e. the `showTutorRealNames`
 * setting is on) the real name leads with the ID + section as a muted subline.
 */
export default function TutorInfoTrigger({
  tutorId,
  anonymousId,
  name,
  section,
  image,
}: {
  tutorId: string;
  anonymousId: string;
  name?: string | null;
  section?: string | null;
  image?: string | null;
}) {
  return (
    <div className="inline-flex items-center gap-2">
      <UserAvatar
        src={image}
        name={name}
        anonymousId={anonymousId}
        size="xs"
        role="TUTOR"
        subtitle={name && section ? `Section ${section}` : undefined}
      />
      <Link
        href={`/learner/tutors/${tutorId}`}
        className="inline-flex items-center gap-0.5 hover:opacity-80 transition-opacity"
      >
        {name ? (
          <span className="min-w-0">
            <span className="font-medium text-xs">{name}</span>
            <span className="block text-2xs text-base-content/50">
              {anonymousId}
              {section ? ` · Section ${section}` : ""}
            </span>
          </span>
        ) : (
          <AnonymousIdBadge id={anonymousId} role="TUTOR" size="sm" />
        )}
        <ChevronRight className="h-3.5 w-3.5 text-base-content/40 shrink-0" />
      </Link>
    </div>
  );
}
