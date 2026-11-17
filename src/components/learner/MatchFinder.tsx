"use client";

import { reportFieldError, reportServerFieldErrors } from "@/lib/formValidation";

import ValidatedForm from "@/components/ui/ValidatedForm";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import ClassCatalogCard from "@/components/classes/ClassCatalogCard";
import MatchCriteriaFields, {
  MatchCriteriaValue,
  EMPTY_CRITERIA,
  criteriaToBody,
} from "@/components/learner/MatchCriteriaFields";

interface MatchReasons {
  matchedTopics: string[];
  verifiedMatchedTopics: string[];
  scheduleFitCount: number;
  gradeMatch: "exact" | "adjacent" | "any" | "none";
}

interface MatchedClass {
  id: string;
  code: string;
  subject: string;
  gradeLevel: string | null;
  topics: string[];
  verifiedTopics: string[];
  description: string | null;
  sessions: { scheduledAt: string; duration: number; status: "SCHEDULED" | "COMPLETED" | "CANCELLED" }[];
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "SUSPENDED" | "BANNED";
  published: boolean;
  suspendedReason: string | null;
  tutor: { id: string; anonymousId: string; name?: string; section?: string; image?: string | null };
  maxStudents: number;
  _count: { enrollments: number };
}

interface Match {
  class: MatchedClass;
  score: number;
  reasons: MatchReasons;
}

/** One plain sentence explaining a result's rank, e.g. "Covers your topic · fits 1 of your times · your grade". */
export function reasonLine(r: MatchReasons, searchedTopics: number): string {
  const parts: string[] = [];
  const matched = r.matchedTopics.length;
  if (matched > 0) {
    parts.push(matched >= searchedTopics
      ? `covers ${searchedTopics === 1 ? "your topic" : "all your topics"}`
      : `covers ${matched} of your ${searchedTopics} topics`);
  }
  if (r.verifiedMatchedTopics.length > 0) {
    parts.push(r.verifiedMatchedTopics.length === matched ? "tutor certified in it" : `tutor certified in ${r.verifiedMatchedTopics.length}`);
  }
  if (r.scheduleFitCount > 0) parts.push(`fits ${r.scheduleFitCount} of your times`);
  if (r.gradeMatch === "exact") parts.push("your grade");
  else if (r.gradeMatch === "adjacent") parts.push("near your grade");
  const line = parts.join(" · ");
  return line ? line[0].toUpperCase() + line.slice(1) : "Open class in this subject";
}

/**
 * Splits the API's ranked list into fit groups: the top score is "Best fit", everything below it "Also fits".
 * Order inside a group is the API's (soonest session first on equal scores), so equal scores never look ranked.
 */
export function groupByFit<T extends { score: number }>(ranked: T[]): T[][] {
  if (ranked.length === 0) return [];
  const top = ranked[0].score;
  const best = ranked.filter((m) => m.score === top);
  const rest = ranked.filter((m) => m.score !== top);
  return rest.length ? [best, rest] : [best];
}

export default function MatchFinder({ defaultGrade }: { defaultGrade: string }) {
  const [criteria, setCriteria] = useState<MatchCriteriaValue>({
    ...EMPTY_CRITERIA,
    gradeLevel: defaultGrade,
  });
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [flipped, setFlipped] = useState(false);
  const [searchedTopics, setSearchedTopics] = useState(0);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const formTop = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  // Move focus with the swap so keyboard and screen-reader users land on the panel they asked for.
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    (flipped ? resultsHeading.current : formTop.current)?.focus();
  }, [flipped]);

  const handleSubmit = async (e: React.FormEvent) => {
    const validationForm = e.currentTarget;
    e.preventDefault();
    setError("");
    if (!criteria.subject) return reportFieldError(e.currentTarget, "Subject", "Please choose a subject.");
    if (criteria.topics.length === 0) return reportFieldError(e.currentTarget, "Topics", "Please choose at least one topic.");

    setLoading(true);
    try {
      const res = await fetch("/api/learner/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(criteriaToBody(criteria)),
      });
      const data = await res.json();
      if (!res.ok && reportServerFieldErrors(validationForm, data)) return;
      if (!res.ok) throw new Error(data.error || "Could not find matches.");
      setMatches(data.matches);
      setSearchedTopics(criteria.topics.length);
      setFlipped(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not find matches.");
    } finally {
      setLoading(false);
    }
  };

  const showResults = flipped && matches !== null;

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="error" message={error || null} />

      {/* Both panels stay mounted (only one is shown), so switching back keeps the form and its loaded catalog. */}
      <section hidden={!showResults} aria-labelledby="match-results" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="match-results" ref={resultsHeading} tabIndex={-1} className="font-serif text-xl font-medium outline-none">
            {matches && matches.length > 0
              ? `${matches.length} class${matches.length === 1 ? "" : "es"} fit`
              : "Nothing open fits yet"}
          </h2>
          <button type="button" onClick={() => setFlipped(false)} className="btn btn-outline">
            Change what I need
          </button>
        </div>

        {matches && matches.length === 0 ? (
          <div className="card kt-card">
            <div className="kt-card-body gap-3">
              <p>No open class covers this right now. Ask for one and tutors who teach it will see your request.</p>
              <Link href="/learner/tutors?tab=requests" className="btn btn-primary self-start">
                Request a class
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {groupByFit(matches ?? []).map((group, gi, all) => {
              const reasons = group.map((m) => reasonLine(m.reasons, searchedTopics));
              const shared = reasons.every((r) => r === reasons[0]) ? reasons[0] : null;
              return (
                <section key={gi} aria-labelledby={`fit-group-${gi}`} className="space-y-3">
                  <div>
                    <h3 id={`fit-group-${gi}`} className="font-serif text-lg font-medium">
                      {all.length === 1 ? "Equally good fits" : gi === 0 ? "Best fit" : "Also fits"}
                      {group.length > 1 && <span className="font-sans text-sm font-normal text-(--kt-muted)"> · soonest first</span>}
                    </h3>
                    {shared && <p className="text-sm text-(--kt-muted)">{shared}</p>}
                  </div>
                  <ul className="grid gap-4 sm:grid-cols-2">
                    {group.map((m, i) => (
                      <li key={m.class.id} className="flex flex-col gap-1.5">
                        {!shared && <p className="text-sm text-(--kt-muted)">{reasons[i]}</p>}
                        <ClassCatalogCard
                          href={`/learner/classes/${m.class.id}?from=browse`}
                          subject={m.class.subject}
                          gradeLevel={m.class.gradeLevel}
                          topics={m.class.topics}
                          verifiedTopics={m.class.verifiedTopics}
                          sessions={m.class.sessions}
                          status={m.class.status}
                          enrolledCount={m.class._count.enrollments}
                          maxStudents={m.class.maxStudents}
                          tutorAnonymousId={m.class.tutor.anonymousId}
                          tutorName={m.class.tutor.name}
                          tutorSection={m.class.tutor.section}
                          showSeats
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </section>

      <div hidden={showResults} ref={formTop} tabIndex={-1} className="card kt-card outline-none">
        <div className="kt-card-body">
          <ValidatedForm onSubmit={handleSubmit} className="space-y-6">
            <MatchCriteriaFields
              value={criteria}
              onChange={setCriteria}
              showFormatFilter
              gradeHint="Used for ranking. Classes from every grade still show."
            />
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading && <span className="loading loading-spinner loading-sm" />}
                Find classes
              </button>
              {matches !== null && (
                <button type="button" onClick={() => setFlipped(true)} className="btn btn-outline">
                  Back to results
                </button>
              )}
            </div>
          </ValidatedForm>
        </div>
      </div>
    </div>
  );
}
