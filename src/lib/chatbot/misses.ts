import type { Role } from "@prisma/client";
import { tokenize } from "@/lib/chatbot/normalize";

// ─── Admin misses review — group raw ChatbotMiss rows by normalised message ──
// `chatbot_misses` only gains a row when the classifier fails, so volume is
// low; grouping happens in JS (not SQL) because the group key is a derived
// token string, not a stored column — see docs/plans/chatbot-assistant.md.

export interface MissRow {
  message: string;
  role: Role;
  createdAt: Date | string;
}

export interface MissGroup {
  /** Normalised token string this group was keyed on ("" -> "(no tokens)"). */
  normalized: string;
  /** The most recent raw message in the group, shown in the UI. */
  sample: string;
  role: Role;
  count: number;
  firstSeen: string;
  lastSeen: string;
}

export type MissSort = "lastSeen" | "count" | "firstSeen";

export interface AggregateMissesOptions {
  role?: Role;
  q?: string;
  sort?: MissSort;
  dir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface AggregateMissesResult {
  groups: MissGroup[];
  total: number;
  page: number;
  pageSize: number;
}

const NO_TOKENS_LABEL = "(no tokens)";

export function aggregateMisses(rows: MissRow[], opts: AggregateMissesOptions = {}): AggregateMissesResult {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, opts.pageSize ?? 25));
  const sort: MissSort = opts.sort === "count" || opts.sort === "firstSeen" ? opts.sort : "lastSeen";
  const dir = opts.dir === "asc" ? "asc" : "desc";

  type Building = Omit<MissGroup, "firstSeen" | "lastSeen"> & { firstSeen: Date; lastSeen: Date };
  const groups = new Map<string, Building>();

  for (const row of rows) {
    if (opts.role && row.role !== opts.role) continue;
    if (opts.q && !row.message.toLowerCase().includes(opts.q.toLowerCase())) continue;

    const normalized = tokenize(row.message).join(" ") || NO_TOKENS_LABEL;
    const key = `${row.role}\x00${normalized}`;
    const createdAt = new Date(row.createdAt);

    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, {
        normalized,
        sample: row.message,
        role: row.role,
        count: 1,
        firstSeen: createdAt,
        lastSeen: createdAt,
      });
      continue;
    }

    existing.count += 1;
    if (createdAt > existing.lastSeen) {
      existing.lastSeen = createdAt;
      existing.sample = row.message; // keep the most recent phrasing
    }
    if (createdAt < existing.firstSeen) existing.firstSeen = createdAt;
  }

  const sorted = [...groups.values()].sort((a, b) => {
    const av = sort === "count" ? a.count : a[sort].getTime();
    const bv = sort === "count" ? b.count : b[sort].getTime();
    return dir === "asc" ? av - bv : bv - av;
  });

  const total = sorted.length;
  const start = (page - 1) * pageSize;
  const paged = sorted.slice(start, start + pageSize).map((g) => ({
    ...g,
    firstSeen: g.firstSeen.toISOString(),
    lastSeen: g.lastSeen.toISOString(),
  }));

  return { groups: paged, total, page, pageSize };
}
