"use client";
export default function CatalogLoadState({ loading, error, retry }: { loading: boolean; error: string | null; retry: () => void }) {
  if (error) return <div role="alert" className="text-xs text-error flex items-center gap-2"><span>{error}</span><button type="button" className="btn btn-xs btn-outline" onClick={retry}>Retry catalog</button></div>;
  return loading ? <p className="text-xs text-base-content/60" role="status">Loading subjects and topics…</p> : null;
}
