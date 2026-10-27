"use client";

export default function LoadErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-error/30 bg-error/5 p-5 text-sm space-y-3">
      <p>{message}</p>
      <button type="button" className="btn btn-outline btn-error min-h-11" onClick={onRetry}>
        Retry loading
      </button>
    </div>
  );
}
