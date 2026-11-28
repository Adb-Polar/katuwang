"use client";

import { useEffect, useState } from "react";
import { type AnalyticsChartId, type AnalyticsFilters, analyticsChartQuery } from "@/lib/analyticsCharts";

/** Loads one dashboard chart and reloads it when its filters change. Keeps the last data while reloading. */
export function useAnalyticsChart<T>(chart: AnalyticsChartId, filters: AnalyticsFilters) {
  const query = analyticsChartQuery(chart, filters);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/admin/reports?${query}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Could not load this chart.");
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load this chart.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [query, retryKey]);

  return { data, loading, error, retry: () => setRetryKey((key) => key + 1) };
}
