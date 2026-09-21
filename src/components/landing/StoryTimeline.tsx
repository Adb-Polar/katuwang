import type { ReactNode } from "react";
import SampleMatchForm from "./SampleMatchForm";
import MatchResultSample from "./MatchResultSample";
import TutorProfileSample from "./TutorProfileSample";
import SampleProgress from "./SampleProgress";

interface Chapter {
  badgeClass: string;
  badge: string;
  title: string;
  body: string;
  visual: ReactNode;
}

const CHAPTERS: Chapter[] = [
  {
    badgeClass: "kt-badge--learner",
    badge: "Learner · STU-2071",
    title: "Describe the help you need.",
    body: "Choose a subject, a topic and your preferred times. Katuwang assigns you an anonymous ID, which is the only identifier other students will ever see.",
    visual: <SampleMatchForm />,
  },
  {
    badgeClass: "kt-badge--info",
    badge: "Auto Match",
    title: "Open classes are ranked by fit.",
    body: "Topic, grade level and availability are scored against every open class, so the best matches appear first. Enrolling takes a single step.",
    visual: <MatchResultSample />,
  },
  {
    badgeClass: "kt-badge--tutor",
    badge: "Tutor · TUT-0148",
    title: "Every tutor is verified per topic.",
    body: "Tutors must pass an assessment for each topic they teach. Learners see the tutor’s anonymous ID and verified-topic badges, never their name.",
    visual: <TutorProfileSample />,
  },
  {
    badgeClass: "kt-badge--success",
    badge: "Progress",
    title: "Progress is measured.",
    body: "A short pre-test before a session and a post-test after it show what changed. Scores are visible only to the learner.",
    visual: <SampleProgress />,
  },
];

export default function StoryTimeline() {
  return (
    <section id="story" className="max-w-4xl mx-auto px-6 py-12 lg:py-16 scroll-mt-4" aria-label="How a tutoring session works, step by step">
      <ol className="relative">
        <div
          aria-hidden="true"
          className="absolute top-0 bottom-0 left-5 md:left-1/2 w-0.5 -translate-x-1/2 bg-linear-to-b from-secondary via-primary to-accent opacity-50"
        />
        {CHAPTERS.map((chapter, index) => (
          <ChapterItem key={chapter.title} chapter={chapter} number={index + 1} flipped={index % 2 === 1} />
        ))}
      </ol>
    </section>
  );
}

function ChapterItem({ chapter, number, flipped }: { chapter: Chapter; number: number; flipped: boolean }) {
  const { badgeClass, badge, title, body, visual } = chapter;
  return (
    <li className="relative grid gap-4 md:grid-cols-2 md:gap-16 items-center py-8 pl-14 md:pl-0">
      <span
        aria-hidden="true"
        className="absolute left-5 md:left-1/2 top-12 md:top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 grid place-items-center w-10 h-10 rounded-full bg-base-100 border-2 border-primary font-mono text-xs text-primary"
      >
        {String(number).padStart(2, "0")}
      </span>

      <div className={flipped ? "md:order-2" : ""}>
        <span className={`kt-badge ${badgeClass}`}>{badge}</span>
        <h2 className="font-sans text-xl sm:text-2xl font-heavy tracking-tight leading-snug mt-2 mb-2">{title}</h2>
        <p className="text-sm text-(--kt-muted) leading-relaxed">{body}</p>
      </div>

      <div className="min-w-0">{visual}</div>
    </li>
  );
}
