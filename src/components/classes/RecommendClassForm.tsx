"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import FeedbackBanner from "@/components/ui/FeedbackBanner";
import FormField from "@/components/ui/FormField";
import AnonymousIdBadge from "@/components/ui/AnonymousIdBadge";
import { formatDateTime } from "@/lib/datetime";
import { gradeSection } from "@/lib/gradeLevels";

interface LearnerOption {
  id: string;
  anonymousId: string;
  gradeLevel: string;
  section: string;
}

interface Recommendation {
  id: string;
  note: string | null;
  createdAt: string;
  dismissedAt: string | null;
  learner: { anonymousId: string; gradeLevel: string; section: string };
}

export default function RecommendClassForm({ classId }: { classId: string }) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<LearnerOption[]>([]);
  const [selected, setSelected] = useState<LearnerOption | null>(null);
  const [note, setNote] = useState("");
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const fetchRecommendations = async (): Promise<Recommendation[] | null> => {
    try {
      const res = await fetch(`/api/admin/classes/${classId}/recommendations`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.recommendations;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    (async () => {
      const data = await fetchRecommendations();
      if (data) setRecommendations(data);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(async () => {
      if (!query.trim()) {
        setOptions([]);
        return;
      }
      setSearching(true);
      try {
        const res = await fetch(
          `/api/admin/users?role=STUDENT_LEARNER&q=${encodeURIComponent(query)}&pageSize=10`
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) setOptions(data.users);
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) {
      setError("Search for and select a learner first.");
      return;
    }
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/classes/${classId}/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerId: selected.id, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to recommend this class.");
      setSuccess(`Recommended to ${selected.anonymousId}.`);
      setSelected(null);
      setQuery("");
      setNote("");
      const refreshed = await fetchRecommendations();
      if (refreshed) setRecommendations(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to recommend this class.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card kt-card">
      <div className="card-body gap-4">
        <h2 className="card-title text-sm font-bold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-secondary" />
          Recommend to a learner
        </h2>

        <FeedbackBanner variant="error" message={error || null} />
        <FeedbackBanner variant="success" message={success || null} />

        <form onSubmit={handleSubmit} className="space-y-3">
          <FormField label="Learner" required hint="Search by anonymous ID or name.">
            {selected ? (
              <div className="flex items-center justify-between rounded-lg border border-base-300 px-3 py-2">
                <div className="flex items-center gap-2 text-xs">
                  <AnonymousIdBadge id={selected.anonymousId} role="LEARNER" />
                  <span className="text-base-content/60">{gradeSection(selected.gradeLevel, selected.section)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="btn btn-ghost btn-2xs text-2xs cursor-pointer"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. STU-0001"
                  className="input input-bordered input-sm w-full text-xs"
                />
                {query.trim() && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-base-300 bg-base-100 shadow-lg max-h-48 overflow-y-auto">
                    {searching ? (
                      <div className="p-3 text-2xs text-base-content/50">Searching...</div>
                    ) : options.length === 0 ? (
                      <div className="p-3 text-2xs text-base-content/50">No matching learners.</div>
                    ) : (
                      options.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setSelected(opt);
                            setQuery("");
                            setOptions([]);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-base-200 cursor-pointer"
                        >
                          <AnonymousIdBadge id={opt.anonymousId} role="LEARNER" />
                          <span className="text-base-content/60">{gradeSection(opt.gradeLevel, opt.section)}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </FormField>

          <FormField label="Note" hint="Optional — shown only to you and other admins, not the learner.">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={2}
              className="textarea textarea-bordered textarea-sm w-full text-xs"
            />
          </FormField>

          <button
            type="submit"
            disabled={saving || !selected}
            className="btn btn-primary btn-sm text-xs cursor-pointer"
          >
            {saving ? <span className="loading loading-spinner loading-xs"></span> : "Recommend class"}
          </button>
        </form>

        {recommendations.length > 0 && (
          <div className="border-t border-base-200 pt-3">
            <h3 className="text-2xs font-semibold uppercase tracking-wide text-base-content/50 mb-2">
              Already recommended
            </h3>
            <ul className="space-y-1.5">
              {recommendations.map((r) => (
                <li key={r.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <AnonymousIdBadge id={r.learner.anonymousId} role="LEARNER" />
                    <span className="text-base-content/50 text-2xs">{formatDateTime(r.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
