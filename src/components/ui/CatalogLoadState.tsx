"use client";
export default function CatalogLoadState({ loading, error, retry }: { loading: boolean; error: string | null; retry: () => void }) {
  if (error) return <div role="alert" className="text-sm text-error flex flex-wrap items-center gap-2"><span>{error}</span><button type="button" className="btn btn-sm btn-outline" onClick={retry}>Retry catalog</button></div>;
  return loading ? <p className="text-sm text-(--kt-muted)" role="status">Loading subjects and topics…</p> : null;
}
