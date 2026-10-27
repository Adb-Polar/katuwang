import { useCallback, useEffect, useState } from "react";

export function useFetchList<T>(url: string, errorMessage = "Failed to load data.") {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      setLoadError("");
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(errorMessage);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) {
          setData([]);
          const message = err instanceof Error ? err.message : errorMessage;
          setError(message);
          setLoadError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [url, errorMessage, version]);

  return { data, loading, error, loadError, setError, refetch };
}
