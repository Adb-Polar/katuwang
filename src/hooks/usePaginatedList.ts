import { useCallback, useEffect, useState } from "react";

export function usePaginatedList<T>(
  baseUrl: string,
  dataKey: string,
  params: Record<string, string>,
  pageSize: number,
  errorMessage = "Failed to load data."
) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  const paramsKey = JSON.stringify(params);
  const [prevParamsKey, setPrevParamsKey] = useState(paramsKey);
  if (paramsKey !== prevParamsKey) {
    setPrevParamsKey(paramsKey);
    setPage(1);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          ...(JSON.parse(paramsKey) as Record<string, string>),
          page: String(page),
          pageSize: String(pageSize),
        });
        const res = await fetch(`${baseUrl}?${query.toString()}`);
        if (!res.ok) throw new Error(errorMessage);
        const json = await res.json();
        if (!cancelled) {
          setData(json[dataKey]);
          setTotal(json.total);
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
  }, [baseUrl, dataKey, paramsKey, page, pageSize, errorMessage, version]);

  return { data, total, page, setPage, loading, error, setError, refetch };
}
