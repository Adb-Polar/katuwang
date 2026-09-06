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
 *
 * `sort` + `dir` live in ONE state object updated by a single pure updater —
 * nesting `setDir` inside a `setSort` updater made the direction flip cancel
 * itself under React's dev double-invoke, so re-clicking a header did nothing.
 */
export function useTableSort(
  defaultSort: string,
  defaultDir: SortDir = "desc",
  defaultDirs: Record<string, SortDir> = {}
) {
  const [{ sort, dir }, setState] = useState<{ sort: string; dir: SortDir }>({
    sort: defaultSort,
    dir: defaultDir,
  });

  const toggle = useCallback(
    (field: string) => {
      setState((prev) =>
        prev.sort === field
          ? { sort: field, dir: prev.dir === "asc" ? "desc" : "asc" }
          : { sort: field, dir: defaultDirs[field] ?? "desc" }
      );
    },
    [defaultDirs]
  );

  return { sort, dir, toggle };
}
