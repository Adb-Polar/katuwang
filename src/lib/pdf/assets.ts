import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export type PdfAssets = { sans: Buffer; serif: Buffer; logoPng: Buffer };

let assets: Promise<PdfAssets> | undefined;

/** Bundled fonts + rasterised logo shared by every server-generated PDF. Cached; a failed load is retried next call. */
export function loadPdfAssets(): Promise<PdfAssets> {
  return assets ??= Promise.all([
    readFile(path.join(process.cwd(), "assets/certificates/DejaVuSans.ttf")),
    readFile(path.join(process.cwd(), "assets/certificates/DejaVuSerif.ttf")),
    readFile(path.join(process.cwd(), "public/logos/green-logo-no-bg.svg")).then(svg => sharp(svg).resize(200).png().toBuffer()),
  ]).then(([sans, serif, logoPng]) => ({ sans, serif, logoPng }))
    .catch(error => { assets = undefined; throw error; });
}
