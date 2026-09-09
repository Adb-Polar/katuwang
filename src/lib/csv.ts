// Minimal CSV helpers — no dependency. `toCsv` is pure (unit-tested);
// `downloadCsv` is browser-only and expected to run from a user gesture.

type CsvValue = string | number | boolean | null | undefined;

/** Quote a single field per RFC 4180 (always quoted, embedded `"` doubled). */
function quote(value: CsvValue): string {
  const s = value == null ? "" : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

/**
 * Serialise an array of row objects to CSV text. Column order comes from
 * `headers` when given, else from the first row's keys. Rows are CRLF-joined and
 * the text ends with a trailing CRLF.
 */
export function toCsv(
  rows: ReadonlyArray<Record<string, CsvValue>>,
  headers?: readonly string[],
): string {
  const cols = headers ?? (rows.length ? Object.keys(rows[0]) : []);
  const lines = [cols.map(quote).join(",")];
  for (const row of rows) {
    lines.push(cols.map((c) => quote(row[c])).join(","));
  }
  return lines.join("\r\n") + "\r\n";
}

/** Trigger a client-side download of `csv` as `filename`. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
