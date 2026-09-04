"use client";

import { useCallback, useState } from "react";

export type SortDir = "asc" | "desc";

/**
 * Local sort state for a `usePaginatedList` table. Feed `{ sort, dir }` into
 * the list's `params` (the list resets to page 1 when they change) and call
 * `toggle(field)` from a `SortableTh`.
 *
 * `toggle` flips the direction when the same field is clicked again; a new
 * field starts at `defaultDirs[field]` (or `"desc"`).
 */
export function useTableSort(
  defaultSort: string,
  defaultDir: SortDir = "desc",
  defaultDirs: Record<string, SortDir> = {}
) {
  const [sort, setSort] = useState(defaultSort);
  const [dir, setDir] = useState<SortDir>(defaultDir);

  const toggle = useCallback(
    (field: string) => {
      setSort((prevSort) => {
        if (prevSort === field) {
          setDir((d) => (d === "asc" ? "desc" : "asc"));
          return prevSort;
        }
        setDir(defaultDirs[field] ?? "desc");
        return field;
      });
    },
    [defaultDirs]
  );

  return { sort, dir, toggle };
}
