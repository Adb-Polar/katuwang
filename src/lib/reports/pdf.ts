import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { formatDateTime } from "@/lib/datetime";
import { loadPdfAssets } from "@/lib/pdf/assets";
import type { ReportCell, ReportModel, ReportSection } from "@/lib/reports/types";

// A4 portrait, in PDF points.
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_Y = 24;
const BOTTOM = 48;
const ROW_H = 15;
const BODY_SIZE = 8.5;
const PAD = 4;

const INK = rgb(0.12, 0.14, 0.18);
const MUTED = rgb(0.38, 0.42, 0.48);
const BRAND = rgb(0.08, 0.19, 0.35);
const RULE = rgb(0.82, 0.85, 0.88);
const HEAD_BG = rgb(0.93, 0.95, 0.97);

const clean = (v: ReportCell) => (v == null ? "—" : String(v).replace(/[\r\n\t]+/g, " "));

/** Shortens `text` with an ellipsis until it fits `maxW`. */
function fit(text: string, font: PDFFont, size: number, maxW: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxW) return text;
  let lo = 0, hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (font.widthOfTextAtSize(text.slice(0, mid) + "…", size) <= maxW) lo = mid; else hi = mid - 1;
  }
  return text.slice(0, lo) + "…";
}

class Writer {
  page!: PDFPage;
  y = 0;
  constructor(private doc: PDFDocument, readonly sans: PDFFont, readonly serif: PDFFont) { this.newPage(); }

  newPage() {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.y = PAGE_H - MARGIN;
  }

  /** Starts a new page when fewer than `h` points remain; returns true if it did. */
  ensure(h: number): boolean {
    if (this.y - h >= BOTTOM) return false;
    this.newPage();
    return true;
  }

  text(t: string, x: number, size: number, opts: { font?: PDFFont; color?: typeof INK; maxW?: number } = {}) {
    const font = opts.font ?? this.sans;
    this.page.drawText(fit(clean(t), font, size, opts.maxW ?? CONTENT_W), { x, y: this.y, size, font, color: opts.color ?? INK });
  }
}

function drawTable(w: Writer, section: ReportSection) {
  const weights = section.columns.map((c) => c.weight ?? 1);
  const total = weights.reduce((a, b) => a + b, 0);
  const widths = weights.map((wt) => (wt / total) * CONTENT_W);

  const title = (cont: boolean) => {
    w.ensure(18 + ROW_H * 2);
    w.y -= 14;
    w.text(section.title + (cont ? " (continued)" : ""), MARGIN, 12, { font: w.serif, color: BRAND });
    w.y -= 8;
  };
  const header = () => {
    w.page.drawRectangle({ x: MARGIN, y: w.y - ROW_H, width: CONTENT_W, height: ROW_H, color: HEAD_BG });
    w.y -= ROW_H - 4.5;
    let x = MARGIN;
    section.columns.forEach((c, i) => {
      const label = fit(c.label, w.sans, BODY_SIZE, widths[i] - PAD * 2);
      const tx = c.align === "right" ? x + widths[i] - PAD - w.sans.widthOfTextAtSize(label, BODY_SIZE) : x + PAD;
      w.page.drawText(label, { x: tx, y: w.y, size: BODY_SIZE, font: w.sans, color: MUTED });
      x += widths[i];
    });
    w.y -= 4.5;
  };

  title(false);
  if (section.rows.length === 0) {
    w.y -= 12;
    w.text(section.emptyText ?? "No records in this period.", MARGIN, 9, { color: MUTED });
    w.y -= 4;
    return;
  }
  header();
  for (const row of section.rows) {
    if (w.ensure(ROW_H)) { title(true); header(); }
    w.y -= ROW_H - 4.5;
    let x = MARGIN;
    section.columns.forEach((c, i) => {
      const value = fit(clean(row[c.key] ?? null), w.sans, BODY_SIZE, widths[i] - PAD * 2);
      const tx = c.align === "right" ? x + widths[i] - PAD - w.sans.widthOfTextAtSize(value, BODY_SIZE) : x + PAD;
      w.page.drawText(value, { x: tx, y: w.y, size: BODY_SIZE, font: w.sans, color: INK });
      x += widths[i];
    });
    w.y -= 4.5;
    w.page.drawLine({ start: { x: MARGIN, y: w.y }, end: { x: MARGIN + CONTENT_W, y: w.y }, thickness: 0.4, color: RULE });
  }
  if (section.note) {
    w.ensure(14);
    w.y -= 12;
    w.text(section.note, MARGIN, 8, { color: MUTED });
  }
}

/** All values are drawn as PDF text: no HTML rendering, remote URLs, or user-supplied paths. */
export async function renderReportPdf(model: ReportModel): Promise<Uint8Array> {
  const assets = await loadPdfAssets();
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const sans = await doc.embedFont(assets.sans, { subset: true });
  const serif = await doc.embedFont(assets.serif, { subset: true });
  const logo = await doc.embedPng(assets.logoPng);
  const w = new Writer(doc, sans, serif);

  // Header
  w.page.drawImage(logo, { x: MARGIN, y: w.y - 30, width: 32, height: 30 });
  w.y -= 10;
  w.text("KATUWANG TUTORING PLATFORM", MARGIN + 42, 9, { color: MUTED });
  w.y -= 20;
  w.text(model.title, MARGIN + 42, 18, { font: serif, color: BRAND, maxW: CONTENT_W - 42 });
  w.y -= 16;
  w.page.drawLine({ start: { x: MARGIN, y: w.y }, end: { x: PAGE_W - MARGIN, y: w.y }, thickness: 1, color: BRAND });

  // Meta lines
  w.y -= 6;
  for (const m of model.meta) {
    w.y -= 13;
    w.text(`${m.label}:`, MARGIN, 9, { color: MUTED, maxW: 110 });
    w.text(m.value, MARGIN + 115, 9, { maxW: CONTENT_W - 115 });
  }

  // Summary tiles, four per row
  if (model.summary.length) {
    const perRow = 4, tileW = CONTENT_W / perRow, tileH = 38;
    w.y -= 12;
    for (let i = 0; i < model.summary.length; i += perRow) {
      w.ensure(tileH + 4);
      const top = w.y;
      model.summary.slice(i, i + perRow).forEach((k, j) => {
        const x = MARGIN + j * tileW;
        w.page.drawRectangle({ x: x + 2, y: top - tileH, width: tileW - 4, height: tileH, borderColor: RULE, borderWidth: 0.6 });
        w.page.drawText(fit(k.label, sans, 7.5, tileW - 14), { x: x + 8, y: top - 12, size: 7.5, font: sans, color: MUTED });
        w.page.drawText(fit(clean(k.value), serif, 14, tileW - 14), { x: x + 8, y: top - 30, size: 14, font: serif, color: INK });
      });
      w.y = top - tileH - 4;
    }
  }

  for (const section of model.sections) {
    w.y -= 6;
    drawTable(w, section);
  }

  // Footer on every page
  const pages = doc.getPages();
  const generated = `Generated ${formatDateTime(model.generatedAt)} (PHT) · Katuwang Tutoring Platform`;
  pages.forEach((p, i) => {
    p.drawText(fit(generated, sans, 7.5, CONTENT_W - 80), { x: MARGIN, y: FOOTER_Y, size: 7.5, font: sans, color: MUTED });
    const label = `Page ${i + 1} of ${pages.length}`;
    p.drawText(label, { x: PAGE_W - MARGIN - sans.widthOfTextAtSize(label, 7.5), y: FOOTER_Y, size: 7.5, font: sans, color: MUTED });
  });

  doc.setTitle(`Katuwang ${model.title}`);
  doc.setAuthor("Katuwang Tutoring Platform");
  doc.setCreationDate(model.generatedAt);
  doc.setModificationDate(model.generatedAt);
  return doc.save();
}
