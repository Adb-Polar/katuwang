import { ChevronLeft, ChevronRight } from "lucide-react";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (pageCount <= 1 && !onPageSizeChange) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 font-mono">
      <span className="text-2xs text-base-content/50">
        Page {page} of {pageCount} · {total} total
      </span>
      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <select
            aria-label="Rows per page"
            className="select select-xs select-bordered rounded-field text-2xs"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt} / page
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="btn btn-ghost btn-xs"
        >
          <ChevronLeft className="w-3 h-3" />
          Prev
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          className="btn btn-ghost btn-xs"
        >
          Next
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
