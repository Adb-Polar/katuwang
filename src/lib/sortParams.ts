// Shared parser for `?sort=<field>&dir=asc|desc` on admin list routes.
// Each route passes its own whitelist of sortable keys; anything else falls
// back to `fallback` / `defaultDir`.

export type SortDir = "asc" | "desc";

export function parseSort(
  searchParams: URLSearchParams,
  allowed: readonly string[],
  fallback: string,
  defaultDir: SortDir = "desc"
): { sort: string; dir: SortDir } {
  const sortParam = searchParams.get("sort") || fallback;
  const sort = allowed.includes(sortParam) ? sortParam : fallback;
  const dirParam = searchParams.get("dir");
  const dir: SortDir = dirParam === "asc" || dirParam === "desc" ? dirParam : defaultDir;
  return { sort, dir };
}
