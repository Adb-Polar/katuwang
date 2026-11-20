import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { renderReportCsv } from "@/lib/reports/csv";
import { renderReportPdf } from "@/lib/reports/pdf";
import { reportFilename } from "@/lib/reports/respond";
import type { ReportModel } from "@/lib/reports/types";

const model = (rows = 2): ReportModel => ({
  title: "Test Report",
  filenameBase: "katuwang test/../report",
  meta: [{ label: "Period", value: "Nov 1 – Nov 2" }],
  summary: [{ label: "Sessions", value: 3 }, { label: "Gain", value: "+5" }],
  sections: [
    {
      title: "Scores",
      columns: [{ key: "topic", label: "Topic" }, { key: "delta", label: "Gain", align: "right" }],
      rows: Array.from({ length: rows }, (_, i) => ({ topic: `Topic ${i}`, delta: -i })),
    },
    { title: "Empty", columns: [{ key: "x", label: "X" }], rows: [] },
  ],
  generatedAt: new Date("2026-11-19T00:00:00Z"),
});

describe("renderReportCsv", () => {
  it("flattens meta, summary and every section under a Section column", () => {
    const csv = renderReportCsv(model());
    const lines = csv.replace(/^﻿/, "").trim().split("\r\n");
    expect(lines[0]).toBe('"Section","Item","Value","Topic","Gain","X"');
    expect(lines).toContain('"Summary","Sessions","3","","",""');
    expect(lines).toContain('"Scores","","","Topic 1","-1",""');
  });

  it("neutralises spreadsheet formulas in text cells but not numbers", () => {
    const m = model(0);
    m.sections[0].rows = [{ topic: "=HYPERLINK(\"x\")", delta: -3 }];
    const csv = renderReportCsv(m);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).toContain('"-3"');
  });
});

describe("renderReportPdf", () => {
  it("produces a valid PDF that paginates long tables", async () => {
    const bytes = await renderReportPdf(model(150));
    expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe("%PDF-");
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThan(1);
  });
});

describe("reportFilename", () => {
  it("strips unsafe characters and appends the range", () => {
    expect(reportFilename(model(), { from: "2026-11-01", to: "2026-11-02" } as never, "csv"))
      .toBe("katuwang-test-report_2026-11-01_to_2026-11-02.csv");
  });
});

describe("renderReportCsv signed numbers", () => {
  it("keeps signed gains as plain values but guards -formulas", () => {
    const m = model(0);
    m.sections[0].rows = [{ topic: "-2+3", delta: "+30" }];
    const csv = renderReportCsv(m);
    expect(csv).toContain('"+30"');
    expect(csv).toContain(`"'-2+3"`);
  });
});

describe("renderReportCsv reserved headers", () => {
  it("keeps the Section column for the section title when a data column is also called Section", () => {
    const m = model(0);
    m.sections = [{ title: "Users", columns: [{ key: "s", label: "Section" }], rows: [{ s: "Rizal" }] }];
    const lines = renderReportCsv(m).replace(/^﻿/, "").trim().split("\r\n");
    expect(lines[0]).toBe('"Section","Item","Value","Section (data)"');
    expect(lines).toContain('"Users","","","Rizal"');
  });
});
