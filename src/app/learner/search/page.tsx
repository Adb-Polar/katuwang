import PageHeader from "@/components/ui/PageHeader";
import SearchResults from "@/components/search/SearchResults";
import { parseScope } from "@/lib/searchScopes";

export const metadata = {
  title: "Search | Katuwang",
};

export default async function LearnerSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; scope?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const scope = parseScope("learner", params.scope);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Maghanap" title={q ? `Results for “${q}”` : "Search"} />
      <SearchResults key={`${scope}:${q}`} audience="learner" q={q} scope={scope} />
    </div>
  );
}
