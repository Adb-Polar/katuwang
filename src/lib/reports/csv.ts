import { toCsv } from "@/lib/csv";
import type { ReportCell, ReportModel } from "@/lib/reports/types";

// Spreadsheet apps execute cells starting with these; prefix text cells with ' (OWASP CSV injection).
// Plain signed numbers ("+12", "-3") are exempt: they are data, not formulas.
const FORMULA_START = /^[=+\-@\t\r]/;
const SIGNED_NUMBER = /^[+-]\d+(\.\d+)?$/;
const safe = (v: ReportCell) => (typeof v === "string" && FORMULA_START.test(v) && !SIGNED_NUMBER.test(v) ? `'${v}` : v);

/**
 * One flat CSV: a `Section` column plus the union of every section's column
 * labels. Summary tiles become rows of the "Summary" section (Item/Value).
 */
const RESERVED = ["Section", "Item", "Value"];
/** A data column named like a reserved one (e.g. a school "Section") gets a distinct header. */
const headerFor = (label: string) => (RESERVED.includes(label) ? `${label} (data)` : label);

export function renderReportCsv(model: ReportModel): string {
  const headers = [...RESERVED];
  const add = (label: string) => { if (!headers.includes(label)) headers.push(label); };
  for (const s of model.sections) s.columns.forEach((c) => add(headerFor(c.label)));

  const rows: Record<string, ReportCell>[] = [];
  for (const m of model.meta) rows.push({ Section: "Report", Item: m.label, Value: m.value });
  for (const k of model.summary) rows.push({ Section: "Summary", Item: k.label, Value: k.value });
  for (const s of model.sections) {
    if (s.note) rows.push({ Section: s.title, Item: "Note", Value: s.note });
    for (const r of s.rows) {
      const row: Record<string, ReportCell> = { Section: s.title };
      for (const c of s.columns) row[headerFor(c.label)] = r[c.key] ?? null;
      rows.push(row);
    }
  }
  const sanitized = rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, safe(v)])));
  // BOM so Excel reads UTF-8 (Ñ, en dashes) correctly.
  return "﻿" + toCsv(sanitized, headers);
}
