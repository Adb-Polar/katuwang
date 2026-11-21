import PageHeader from "@/components/ui/PageHeader";
import SearchResults from "@/components/search/SearchResults";
import { parseScope } from "@/lib/searchScopes";

export const metadata = {
  title: "Search | Katuwang",
};

export default async function AdminSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; scope?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const scope = parseScope("admin", params.scope);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Maghanap" title={q ? `Results for “${q}”` : "Search"} />
      <SearchResults key={`${scope}:${q}`} audience="admin" q={q} scope={scope} />
    </div>
  );
}
