"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { SortDir } from "@/hooks/useTableSort";

/**
 * A `<th>` whose label is a button that sorts the table by `field`.
 * Wire it to `useTableSort`: pass its `sort`/`dir` and `toggle`.
 */
export default function SortableTh({
  label,
  field,
  sort,
  dir,
  onSort,
  className,
}: {
  label: string;
  field: string;
  sort: string;
  dir: SortDir;
  onSort: (field: string) => void;
  className?: string;
}) {
  const active = sort === field;
  return (
    <th className={className} aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1 font-bold hover:text-primary transition-colors cursor-pointer"
      >
        {label}
        {active ? (
          dir === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </th>
  );
}
