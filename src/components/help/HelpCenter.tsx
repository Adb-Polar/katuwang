"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { HELP_CONTENT, type HelpRole } from "@/lib/help/helpContent";

const sectionTitle = "font-serif text-2xl font-medium leading-tight";
const rowSummary =
  "flex items-center justify-between gap-3 px-5 py-4 cursor-pointer list-none font-medium hover:bg-base-200 [&::-webkit-details-marker]:hidden";

function Chevron() {
  return <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-(--kt-muted) transition-transform group-open:rotate-180" />;
}

/**
 * In-app Help: one search over the how-to guides and the FAQs, then both as flat lists of rows that open in
 * place. Rendered by each portal's `/help` page with its own role — only that role's content is shown.
 */
export default function HelpCenter({ role, chatAvailable = false }: { role: HelpRole; chatAvailable?: boolean }) {
  const entry = HELP_CONTENT[role];
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const guides = useMemo(
    () => (q ? entry.guides.filter((g) => [g.title, ...g.steps].some((t) => t.toLowerCase().includes(q))) : entry.guides),
    [entry.guides, q],
  );

  const faqGroups = useMemo(() => {
    const matches = q
      ? entry.faqs.filter((f) => [f.question, f.answer, f.category].some((t) => t.toLowerCase().includes(q)))
      : entry.faqs;
    const groups: { category: string; items: typeof matches }[] = [];
    for (const faq of matches) {
      let g = groups.find((x) => x.category === faq.category);
      if (!g) groups.push((g = { category: faq.category, items: [] }));
      g.items.push(faq);
    }
    return groups;
  }, [entry.faqs, q]);

  const nothing = guides.length === 0 && faqGroups.length === 0;

  return (
    <div className="space-y-10">
      <label className="input input-bordered flex items-center gap-2 w-full sm:max-w-md">
        <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-(--kt-muted)" />
        <input
          type="search"
          className="grow"
          placeholder="Search help"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search guides and questions"
        />
      </label>

      {nothing && (
        <p className="text-(--kt-muted)">
          Nothing matches “{query}”. Try a shorter word{chatAvailable ? ", or ask the chat helper in the corner" : ""}.
        </p>
      )}

      {/* Wide screens: guides and questions side by side. */}
      <div className="grid gap-10 items-start xl:grid-cols-2">
      {guides.length > 0 && (
        <section aria-labelledby="help-guides" className="space-y-3">
          <h2 id="help-guides" className={sectionTitle}>How to…</h2>
          <div className="card kt-card">
            {guides.map((guide) => (
              <details key={guide.title} open={!!q || undefined} className="group border-b border-(--kt-border) last:border-b-0">
                <summary className={rowSummary}>
                  {guide.title}
                  <Chevron />
                </summary>
                {/* Steps as a numbered rail: serif numbers on a thin line. */}
                <ol className="mx-5 mb-5 ml-8 border-l border-(--kt-border) space-y-3">
                  {guide.steps.map((step, i) => (
                    <li key={i} className="relative pl-6">
                      <span
                        aria-hidden="true"
                        className="absolute -left-3 top-0 w-6 bg-base-100 text-center font-serif text-lg leading-6 text-primary"
                      >
                        {i + 1}
                      </span>
                      <span className="sr-only">Step {i + 1}: </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </details>
            ))}
          </div>
        </section>
      )}

      {faqGroups.length > 0 && (
        <section aria-labelledby="help-faqs" className="space-y-3">
          <h2 id="help-faqs" className={sectionTitle}>Questions</h2>
          <div className="card kt-card">
            {faqGroups.map((group) => (
              <div key={group.category} className="border-b border-(--kt-border) last:border-b-0">
                <h3 className="px-5 pt-4 font-serif text-lg text-(--kt-muted)">{group.category}</h3>
                {group.items.map((faq) => (
                  <details key={faq.question} open={!!q || undefined} className="group">
                    <summary className={rowSummary}>
                      {faq.question}
                      <Chevron />
                    </summary>
                    <p className="px-5 pb-4 max-w-prose">{faq.answer}</p>
                  </details>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}
      </div>

      <p className="border-t border-(--kt-border) pt-6 text-(--kt-muted)">
        Still stuck? {chatAvailable ? "Ask the chat helper in the bottom corner, or talk" : "Talk"} to a Katuwang administrator or your school coordinator.
      </p>
    </div>
  );
}
