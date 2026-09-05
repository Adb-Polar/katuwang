"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { HELP_CONTENT, type HelpRole } from "@/lib/help/helpContent";

const SECTION_LABEL = "text-2xs font-medium uppercase tracking-wider text-base-content/40";

/**
 * In-app Help & FAQ view. Rendered by each portal's `/help` page with its own
 * role — the content shown is scoped to that role only.
 */
export default function HelpCenter({ role }: { role: HelpRole }) {
  const entry = HELP_CONTENT[role];
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filteredFaqs = useMemo(() => {
    if (!q) return entry.faqs;
    return entry.faqs.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q),
    );
  }, [entry.faqs, q]);

  const groupedFaqs = useMemo(() => {
    const groups: { category: string; items: typeof filteredFaqs }[] = [];
    for (const faq of filteredFaqs) {
      let g = groups.find((x) => x.category === faq.category);
      if (!g) {
        g = { category: faq.category, items: [] };
        groups.push(g);
      }
      g.items.push(faq);
    }
    return groups;
  }, [filteredFaqs]);

  return (
    <div className="space-y-10">
      {/* quick links */}
      <section className="space-y-3">
        <p className={SECTION_LABEL}>Jump to</p>
        <div className="flex flex-wrap gap-2">
          {entry.quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="btn btn-sm btn-ghost border border-base-300 font-normal">
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      {/* step-by-step guides */}
      <section className="space-y-3">
        <p className={SECTION_LABEL}>Step-by-step guides</p>
        <div className="grid gap-4 md:grid-cols-2">
          {entry.guides.map((guide) => (
            <div key={guide.title} className="kt-card">
              <div className="kt-card-body gap-2.5">
                <h2 className="text-sm font-medium text-base-content">{guide.title}</h2>
                <ol className="list-decimal space-y-1.5 pl-5 text-sm text-base-content/70 marker:text-base-content/35">
                  {guide.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className={SECTION_LABEL}>Frequently asked questions</p>
          <label className="input input-sm input-bordered flex w-full max-w-xs items-center gap-2 font-normal">
            <Search className="w-4 h-4 shrink-0 opacity-50" />
            <input
              type="search"
              className="grow"
              placeholder="Search FAQs…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search FAQs"
            />
          </label>
        </div>

        {groupedFaqs.length === 0 ? (
          <p className="text-sm text-base-content/60">No FAQs match “{query}”.</p>
        ) : (
          <div className="space-y-6">
            {groupedFaqs.map((group) => (
              <div key={group.category} className="space-y-1.5">
                <p className="text-2xs font-medium uppercase tracking-wider text-base-content/40">
                  {group.category}
                </p>
                {group.items.map((faq) => (
                  <div
                    key={faq.question}
                    className="collapse collapse-arrow border border-base-300 bg-base-100 rounded-box"
                  >
                    <input type="checkbox" defaultChecked={!!q} />
                    <div className="collapse-title text-sm font-medium min-h-0 py-3">
                      {faq.question}
                    </div>
                    <div className="collapse-content text-sm text-base-content/70">
                      <p className="pb-1">{faq.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-sm text-base-content/50">
        Still stuck? Reach out to a Katuwang administrator or your school
        coordinator for help.
      </p>
    </div>
  );
}
