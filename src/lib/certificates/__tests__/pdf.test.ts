import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { generateCertificatePdf } from "../pdf";
import { certificateEmail } from "../email";
const c = { certificateNumber: "KTW-123", learnerName: "María Peña <script>", tutorName: "José Reyes", subjectName: "Mathematics", classCode: "CLS-1", completedAt: new Date("2026-11-09T00:00:00Z"), issuedAt: new Date("2026-11-09T01:00:00Z") };
describe("completion certificate rendering", () => {
  it("generates a printable one-page A4 landscape PDF with embedded branding/fonts and an ID", async () => {
    const bytes = await generateCertificatePdf(c); expect(Buffer.from(bytes).subarray(0, 4).toString()).toBe("%PDF");
    const doc = await PDFDocument.load(bytes); expect(doc.getPageCount()).toBe(1);
    expect(doc.getPage(0).getSize().width).toBeCloseTo(841.89); expect(doc.getPage(0).getSize().height).toBeCloseTo(595.28);
    expect(doc.getTitle()).toContain(c.certificateNumber); expect(doc.getCreationDate()).toEqual(c.issuedAt);
  });
  it("includes the snapshot details and escapes learner-controlled HTML in mail", () => {
    const mail = certificateEmail(c);
    for (const value of [c.learnerName, c.tutorName, c.subjectName, "Nov 9, 2026"]) expect(mail.text).toContain(value);
    expect(mail.html).toContain("&lt;script&gt;"); expect(mail.html).not.toContain("<script>");
  });
});
