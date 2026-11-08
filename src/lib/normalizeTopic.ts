/** Trim and collapse whitespace without consulting any catalog. */
export function normalizeTopic(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}
