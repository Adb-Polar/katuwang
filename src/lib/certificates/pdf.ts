import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import sharp from "sharp";
import { formatDate } from "@/lib/datetime";

export type CertificateSnapshot = {
  certificateNumber: string; learnerName: string; tutorName: string;
  subjectName: string; classCode: string; completedAt: Date; issuedAt: Date;
};
let assets: Promise<Buffer[]> | undefined;
function loadAssets() {
  return assets ??= Promise.all([
    readFile(path.join(process.cwd(), "assets/certificates/DejaVuSans.ttf")),
    readFile(path.join(process.cwd(), "assets/certificates/DejaVuSerif.ttf")),
    readFile(path.join(process.cwd(), "public/logos/green-logo-no-bg.svg")).then(svg => sharp(svg).resize(200).png().toBuffer()),
  ]).catch(error => { assets = undefined; throw error; });
}

/** All input is drawn as PDF text; no HTML rendering, remote URLs, or user-supplied paths. */
export async function generateCertificatePdf(snapshot: CertificateSnapshot): Promise<Uint8Array> {
  const [sansBytes, serifBytes, logoBytes] = await loadAssets();
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const sans = await doc.embedFont(sansBytes, { subset: true });
  const serif = await doc.embedFont(serifBytes, { subset: true });
  const logo = await doc.embedPng(logoBytes);
  // A4 landscape, in PDF points.
  const [width, height] = [841.89, 595.28];
  const page = doc.addPage([width, height]);
  const blue = rgb(0.08, 0.19, 0.35), gold = rgb(0.72, 0.55, 0.21), grey = rgb(0.3, 0.34, 0.4);
  page.drawRectangle({ x: 22, y: 22, width: width - 44, height: height - 44, borderColor: blue, borderWidth: 3 });
  page.drawRectangle({ x: 31, y: 31, width: width - 62, height: height - 62, borderColor: gold, borderWidth: 1 });
  page.drawImage(logo, { x: width / 2 - 23, y: 491, width: 46, height: 43 });
  function centered(text: string, y: number, size: number, font: PDFFont = sans, color = grey, maxWidth = 700) {
    const clean = text.replace(/[\r\n\t]/g, " ");
    // Preserve complete names/details, fitting rather than truncating them.
    while (font.widthOfTextAtSize(clean, size) > maxWidth && size > 8) size -= 0.5;
    page.drawText(clean, { x: (width - font.widthOfTextAtSize(clean, size)) / 2, y, size, font, color });
  }
  centered("KATUWANG TUTORING PLATFORM", 468, 13, sans, blue);
  centered("CERTIFICATE OF COMPLETION", 416, 31, serif, blue);
  centered("This certificate is proudly presented to", 372, 13);
  centered(snapshot.learnerName, 318, 37, serif, blue);
  page.drawLine({ start: { x: 170, y: 304 }, end: { x: width - 170, y: 304 }, thickness: 1, color: gold });
  centered("For successfully completing the tutoring class", 272, 13);
  centered(snapshot.subjectName, 235, 23, serif, blue);
  centered(`Class ${snapshot.classCode}`, 210, 10);
  centered("under the guidance of", 181, 12);
  centered(snapshot.tutorName, 152, 20, serif, blue);
  centered(`Completed on: ${formatDate(snapshot.completedAt)}`, 116, 12);
  centered(`Issued: ${formatDate(snapshot.issuedAt)} · Issued by the Katuwang Tutoring Platform`, 91, 10);
  centered(`Certificate ID: ${snapshot.certificateNumber}`, 58, 10, sans, blue);
  doc.setTitle(`Katuwang Certificate of Completion - ${snapshot.certificateNumber}`);
  doc.setAuthor("Katuwang Tutoring Platform");
  doc.setCreationDate(snapshot.issuedAt);
  doc.setModificationDate(snapshot.issuedAt);
  return doc.save();
}
