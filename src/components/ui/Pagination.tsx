import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-2">
      <span className="text-2xs text-base-content/50">
        Page {page} of {pageCount} · {total} total
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="btn btn-outline btn-xs"
        >
          <ChevronLeft className="w-3 h-3" />
          Prev
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          className="btn btn-outline btn-xs"
        >
          Next
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
