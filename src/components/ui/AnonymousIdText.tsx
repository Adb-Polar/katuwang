const ROLE_CLASSES = {
  LEARNER: "kt-id--learner",
  TUTOR: "kt-id--tutor",
  ADMIN: "",
} as const;

/**
 * An anonymous ID set in the serif ID face and coloured by its owner's role
 * (learner coral, tutor ube, admin ink) — the plain-text alternative to the
 * `AnonymousIdBadge` pill.
 */
export default function AnonymousIdText({
  id,
  role,
  className = "",
}: {
  id: string;
  role: keyof typeof ROLE_CLASSES;
  className?: string;
}) {
  return <span className={`kt-id ${ROLE_CLASSES[role]} ${className}`.trim()}>{id}</span>;
}
