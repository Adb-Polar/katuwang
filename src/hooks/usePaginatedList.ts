import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function usePaginatedList<T>(
  baseUrl: string,
  dataKey: string,
  params: Record<string, string>,
  pageSize: number,
  errorMessage = "Failed to load data.",
  /**
   * URL query-key prefix, so two paginated lists on one route don't collide.
   * Defaults to `dataKey`. Produces `?<key>Page=` / `?<key>Size=`.
   */
  key = dataKey
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pageParam = `${key}Page`;
  const sizeParam = `${key}Size`;

  const page = Math.max(1, Number(searchParams.get(pageParam)) || 1);
  const effectivePageSize = Math.max(1, Number(searchParams.get(sizeParam)) || pageSize);

  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  // The rest of the response body (e.g. `counts`), for callers that need tab badges.
  const [meta, setMeta] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  const syncUrl = useCallback(
    (next: Record<string, string | null>) => {
      const sp = new URLSearchParams(Array.from(searchParams.entries()));
      for (const [k, v] of Object.entries(next)) {
        if (v === null) sp.delete(k);
        else sp.set(k, v);
      }
      const qs = sp.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const setPage = useCallback(
    (p: number) => syncUrl({ [pageParam]: String(Math.max(1, p)) }),
    [syncUrl, pageParam]
  );

  const setPageSize = useCallback(
    (s: number) => syncUrl({ [sizeParam]: String(Math.max(1, s)), [pageParam]: "1" }),
    [syncUrl, sizeParam, pageParam]
  );

  // Reset to page 1 when the filter params change.
  const paramsKey = JSON.stringify(params);
  const prevParamsKey = useRef(paramsKey);
  useEffect(() => {
    if (paramsKey !== prevParamsKey.current) {
      prevParamsKey.current = paramsKey;
      if (page !== 1) setPage(1);
    }
  }, [paramsKey, page, setPage]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          ...(JSON.parse(paramsKey) as Record<string, string>),
          page: String(page),
          pageSize: String(effectivePageSize),
        });
        const res = await fetch(`${baseUrl}?${query.toString()}`);
        if (!res.ok) throw new Error(errorMessage);
        const json = await res.json();
        if (!cancelled) {
          setData(Array.isArray(json[dataKey]) ? json[dataKey] : []);
          setTotal(json.total);
          setMeta(json);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : errorMessage);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [baseUrl, dataKey, paramsKey, page, effectivePageSize, errorMessage, version]);

  return {
    data,
    total,
    meta,
    page,
    setPage,
    pageSize: effectivePageSize,
    setPageSize,
    loading,
    error,
    setError,
    refetch,
  };
}
