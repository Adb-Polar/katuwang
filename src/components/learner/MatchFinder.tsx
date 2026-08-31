"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, BadgeCheck, CalendarCheck, GraduationCap } from "lucide-react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import ClassCard from "@/components/classes/ClassCard";
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
  maxStudents: number;
  _count: { enrollments: number };
}

interface Match {
  class: MatchedClass;
  score: number;
  reasons: MatchReasons;
}

function reasonChips(r: MatchReasons) {
  const chips: { icon: typeof BadgeCheck; text: string }[] = [];
  if (r.matchedTopics.length > 0) {
    chips.push({ icon: Sparkles, text: `Covers ${r.matchedTopics.join(", ")}` });
  }
  if (r.verifiedMatchedTopics.length > 0) {
    chips.push({ icon: BadgeCheck, text: `Verified for ${r.verifiedMatchedTopics.join(", ")}` });
  }
  if (r.scheduleFitCount > 0) {
    chips.push({
      icon: CalendarCheck,
      text: `Fits ${r.scheduleFitCount} of your preferred time${r.scheduleFitCount === 1 ? "" : "s"}`,
    });
  }
  if (r.gradeMatch === "exact") chips.push({ icon: GraduationCap, text: "Matches your grade" });
  else if (r.gradeMatch === "adjacent") chips.push({ icon: GraduationCap, text: "Close to your grade" });
  return chips;
}

export default function MatchFinder({ defaultGrade }: { defaultGrade: string }) {
  const router = useRouter();
  const [criteria, setCriteria] = useState<MatchCriteriaValue>({
    ...EMPTY_CRITERIA,
    gradeLevel: defaultGrade,
  });
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!criteria.subject) return setError("Please choose a subject.");
    if (criteria.topics.length === 0) return setError("Please choose at least one topic.");

    setLoading(true);
    try {
      const res = await fetch("/api/learner/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(criteriaToBody(criteria)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not find matches.");
      setMatches(data.matches);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not find matches.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <FeedbackBanner variant="error" message={error || null} />

      <section className="card bg-base-100 shadow-md border border-base-200">
        <div className="card-body gap-5 p-6 sm:p-8">
          <div>
            <h2 className="card-title text-base font-bold">What do you need help with?</h2>
            <p className="text-xs text-base-content/60 mt-1">
              Pick a subject and topics, add the times you&apos;re free, and we&apos;ll rank the open classes that fit.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <MatchCriteriaFields
              value={criteria}
              onChange={setCriteria}
              gradeHint="Prefilled from your profile — change it if this class is for a different level."
            />
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-md text-sm gap-2 w-full sm:w-auto"
            >
              {loading ? <span className="loading loading-spinner loading-sm" /> : <Sparkles className="h-4 w-4" />}
              Auto Match
            </button>
          </form>
        </div>
      </section>

      {matches !== null && (
        <section className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body gap-4">
            <h2 className="card-title text-sm font-bold">
              {matches.length > 0 ? `${matches.length} class${matches.length === 1 ? "" : "es"} for you` : "No matches yet"}
            </h2>

            {matches.length === 0 ? (
              <div className="text-center py-8 bg-base-200/10 border border-dashed border-base-300 rounded-xl space-y-2">
                <p className="text-xs text-base-content/50 italic">
                  Nothing open fits this right now.
                </p>
                <Link href="/learner/requests" className="btn btn-outline btn-xs text-xs">
                  Post a topic request instead
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {matches.map((m) => (
                  <div key={m.class.id} className="space-y-1.5">
                    <ClassCard
                      code={m.class.code}
                      subject={m.class.subject}
                      gradeLevel={m.class.gradeLevel}
                      topics={m.class.topics}
                      verifiedTopics={m.class.verifiedTopics}
                      description={m.class.description}
                      sessions={m.class.sessions}
                      status={m.class.status}
                      published={m.class.published}
                      enrolledCount={m.class._count.enrollments}
                      maxStudents={m.class.maxStudents}
                      activeLabel="Open"
                      onClick={() => router.push(`/learner/classes/${m.class.id}`)}
                    />
                    <ul className="text-2xs text-base-content/60 space-y-0.5 px-1">
                      {reasonChips(m.reasons).map((c, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <c.icon className="h-3 w-3 text-primary shrink-0" />
                          {c.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
