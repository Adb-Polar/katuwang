import type { ReactNode } from "react";
import Link from "next/link";
import RecoveryEmailSettings from "@/components/profile/RecoveryEmailSettings";
import UserAvatar from "@/components/profile/UserAvatar";
import AccountControls from "@/components/profile/AccountControls";
import { GRADE_LEVELS, gradeLabel } from "@/lib/gradeLevels";
import { subjectDisplayLabel } from "@/lib/displayLabels";

function Row({ label, children, empty = false }: { label: string; children: ReactNode; empty?: boolean }) {
  return (
    <div className="grid gap-x-6 gap-y-0.5 py-3 border-b border-(--kt-border) last:border-b-0 sm:grid-cols-[9rem_1fr] sm:items-baseline">
      <dt className="text-sm text-(--kt-muted)">{label}</dt>
      <dd className={`break-words ${empty ? "text-(--kt-muted)" : "text-base font-medium"}`}>{children}</dd>
    </div>
  );
}

function Group({ title, note, action, children }: { title: string; note: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-1">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-(--kt-muted)">{note}</p>
        </div>
        {action}
      </div>
      <dl>{children}</dl>
    </section>
  );
}

const sectionTitle = "font-serif text-2xl font-medium leading-tight";

/**
 * The account page for learners and tutors: who you are (and the anonymous ID peers see), the fields an
 * administrator manages, the self-service fields with an "Edit details" link to `{role}/profile/edit`,
 * (tutors) certified topics, then recovery email and account deletion.
 */
export default function ProfileView({
  eyebrow,
  idRole,
  editHref,
  fullName,
  email,
  anonymousId,
  gradeLevel,
  section,
  contactInfo,
  certifiedTopics,
  image,
  learnersSeeRealName = false,
}: {
  eyebrow: string;
  idRole: "LEARNER" | "TUTOR";
  editHref: string;
  fullName: string;
  email: string;
  anonymousId: string;
  gradeLevel?: string | null;
  section: string;
  contactInfo: string;
  /** Tutor only: their CERTIFIED topics, grouped by subject. */
  certifiedTopics?: { subject: string; topic: string }[];
  image?: string | null;
  /** Tutor only: the `showTutorRealNames` setting is on, so learners see the tutor's real name too. */
  learnersSeeRealName?: boolean;
}) {
  const gradeText =
    GRADE_LEVELS.find((g) => g.value === gradeLevel)?.label ?? (gradeLevel ? gradeLabel(gradeLevel) : "Not set");
  const topicsBySubject = new Map<string, string[]>();
  for (const c of certifiedTopics ?? []) {
    topicsBySubject.set(c.subject, [...(topicsBySubject.get(c.subject) ?? []), c.topic]);
  }
  const peers = idRole === "TUTOR" ? "Learners" : "Tutors and classmates";

  const isTutor = idRole === "TUTOR";
  const nameIsShown = isTutor && learnersSeeRealName;
  const topicCount = certifiedTopics?.length ?? 0;
  const gradeSection = [gradeLevel ? gradeText : null, section ? `Section ${section}` : null].filter(Boolean).join(" · ");

  return (
    <div className="space-y-8 max-w-3xl">
      {/* The page is about you: your name is the h1, on the one tinted band (in your role's colour). */}
      <section
        aria-labelledby="account-name"
        className={`rounded-(--kt-radius-box) px-5 py-6 sm:px-7 flex flex-col sm:flex-row sm:items-center gap-5 ${isTutor ? "bg-accent/15" : "bg-secondary/10"}`}
      >
        <UserAvatar
          src={image}
          name={fullName}
          anonymousId={anonymousId}
          size="xl"
          role={idRole}
          modalTitle={`${fullName} - Profile Picture`}
        />
        <div className="min-w-0 space-y-1">
          <p className="font-serif italic text-base leading-none text-primary">{eyebrow}</p>
          <h1 id="account-name" className="font-serif text-3xl sm:text-4xl font-medium tracking-tight leading-tight break-words">
            {fullName}
          </h1>
          {gradeSection && <p className="text-base">{gradeSection}</p>}
          <p className="text-sm text-(--kt-muted)">
            {nameIsShown ? `${peers} see your name and ` : `${peers} see you only as `}
            <span className={`kt-id text-base ${isTutor ? "kt-id--tutor" : "kt-id--learner"}`}>{anonymousId}</span>
          </p>
        </div>
      </section>

      <section className="card kt-card" aria-labelledby="your-details">
        <div className="kt-card-body gap-6">
          <div>
            <h2 id="your-details" className={sectionTitle}>Your details</h2>
            <p className="text-sm text-(--kt-muted)">
              {nameIsShown
                ? "Your school shows tutors' real names to learners. Your email and contact info stay between you and administrators."
                : "Only you and administrators can see your real name, email and contact info."}
            </p>
          </div>
          <Group title="Set by your school" note="Only an administrator can change these.">
            <Row label="Real name">{fullName}</Row>
            <Row label="Email">{email}</Row>
          </Group>
          <Group
            title="You can change"
            note="Keep these up to date."
            action={<Link href={editHref} className="btn btn-outline">Edit details</Link>}
          >
            <Row label="Grade level" empty={!gradeLevel}>{gradeText}</Row>
            <Row label="Section" empty={!section}>{section || "Not set"}</Row>
            <Row label="Contact info" empty={!contactInfo}>{contactInfo || "Not set"}</Row>
          </Group>
        </div>
      </section>

      {certifiedTopics && (
        <section className="card kt-card">
          <div className="kt-card-body gap-4">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
              <div>
                <h2 className={sectionTitle}>Topics you&apos;re certified in</h2>
                <p className="text-sm text-(--kt-muted)">
                  {topicCount > 0 &&
                    `${topicCount} topic${topicCount === 1 ? "" : "s"} in ${topicsBySubject.size} subject${topicsBySubject.size === 1 ? "" : "s"}. `}
                  Learners see these on your profile.
                </p>
              </div>
              {topicCount > 0 && (
                <Link href="/tutor/assessments" className="btn btn-outline">Add a topic</Link>
              )}
            </div>
            {topicsBySubject.size === 0 ? (
              <p className="text-(--kt-muted)">
                None yet. Pass a topic assessment from the{" "}
                <Link href="/tutor/assessments" className="link link-primary">Assessments page</Link> to add one.
              </p>
            ) : (
              <dl className="border-t border-(--kt-border)">
                {Array.from(topicsBySubject.entries()).map(([subject, topics]) => (
                  <div
                    key={subject}
                    className="grid gap-x-6 gap-y-1 py-3 border-b border-(--kt-border) last:border-b-0 sm:grid-cols-[13rem_1fr] sm:items-baseline"
                  >
                    <dt className="font-semibold">{subjectDisplayLabel(subject)}</dt>
                    <dd>
                      <ul className="space-y-2 leading-snug">
                        {topics.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </section>
      )}

      <RecoveryEmailSettings />
      <AccountControls />
    </div>
  );
}
