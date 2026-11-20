/** Format-neutral report shape: builders produce it once, renderers turn it into PDF or CSV. */
export type ReportCell = string | number | null;

export interface ReportColumn {
  key: string;
  label: string;
  /** Relative PDF column width (default 1). */
  weight?: number;
  align?: "left" | "right";
}

export interface ReportSection {
  title: string;
  columns: ReportColumn[];
  rows: Record<string, ReportCell>[];
  emptyText?: string;
  /** Shown under the table, e.g. a truncation notice. */
  note?: string;
}

export interface ReportModel {
  title: string;
  /** Filename stem, without the date range or extension. */
  filenameBase: string;
  meta: { label: string; value: string }[];
  summary: { label: string; value: ReportCell }[];
  sections: ReportSection[];
  generatedAt: Date;
}

export type ReportFormat = "pdf" | "csv";
