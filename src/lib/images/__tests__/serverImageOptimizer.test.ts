import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { optimizeImageBuffer } from "../serverImageOptimizer";
import { ImageValidationError } from "../imageSafety";

describe("optimizeImageBuffer", () => {
  it("optimizes a high-resolution JPEG, resizing to max bounds and converting to WebP", async () => {
    // Generate a 1200x800 test JPEG
    const testBuffer = await sharp({
      create: {
        width: 1200,
        height: 800,
        channels: 3,
        background: { r: 120, g: 150, b: 200 },
      },
    })
      .jpeg({ quality: 95 })
      .toBuffer();

    const result = await optimizeImageBuffer(testBuffer, { maxDimension: 512 });

    expect(result.format).toBe("webp");
    expect(result.width).toBeLessThanOrEqual(512);
    expect(result.height).toBeLessThanOrEqual(512);
    expect(result.width).toBeGreaterThanOrEqual(511);
    expect(result.width).toBeLessThanOrEqual(512);
    expect(result.height).toBe(341);
    expect(result.optimizedSize).toBeLessThan(result.originalSize);
    expect(result.reductionPercent).toBeGreaterThan(0);
    expect(result.mimeType).toBe("image/webp");
  });

  it("handles transparent PNG images while preserving transparency", async () => {
    // Generate a transparent PNG
    const transparentPng = await sharp({
      create: {
        width: 600,
        height: 600,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 0.5 },
      },
    })
      .png()
      .toBuffer();

    const result = await optimizeImageBuffer(transparentPng, { maxDimension: 512 });

    expect(result.width).toBe(512);
    expect(result.height).toBe(512);

    // Verify output has alpha channel
    const outputMeta = await sharp(result.buffer).metadata();
    expect(outputMeta.hasAlpha).toBe(true);
  });

  it("does not upscale small images that are already below max dimension", async () => {
    // Generate a 150x150 JPEG
    const smallBuffer = await sharp({
      create: {
        width: 150,
        height: 150,
        channels: 3,
        background: { r: 50, g: 100, b: 150 },
      },
    })
      .jpeg({ quality: 80 })
      .toBuffer();

    const result = await optimizeImageBuffer(smallBuffer, { maxDimension: 512 });

    expect(result.width).toBe(150);
    expect(result.height).toBe(150);
  });

  it("rejects non-image buffers with ImageValidationError", async () => {
    const corruptBuffer = Buffer.from("not-an-image-file-header-content");
    await expect(optimizeImageBuffer(corruptBuffer)).rejects.toThrow(ImageValidationError);
  });

  it("rejects empty buffers", async () => {
    await expect(optimizeImageBuffer(Buffer.alloc(0))).rejects.toThrow(ImageValidationError);
  });

  it("rejects files exceeding 2MB limit", async () => {
    // Create an oversized dummy buffer (> 2MB)
    const oversizedBuffer = Buffer.alloc(2.5 * 1024 * 1024);
    await expect(optimizeImageBuffer(oversizedBuffer)).rejects.toThrow(/exceeds maximum limit/);
  });
});
