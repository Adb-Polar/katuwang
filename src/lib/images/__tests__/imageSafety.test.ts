import { describe, it, expect } from "vitest";
import {
  detectImageFormat,
  validateImageDimensions,
  calculateTargetDimensions,
  generateSafeAvatarFilename,
  ImageValidationError,
} from "../imageSafety";

describe("detectImageFormat", () => {
  it("detects JPEG from standard magic bytes FF D8 FF", () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    expect(detectImageFormat(bytes)).toBe("jpeg");
  });

  it("detects PNG from magic bytes 89 50 4E 47 0D 0A 1A 0A", () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    expect(detectImageFormat(bytes)).toBe("png");
  });

  it("detects WebP from RIFF and WEBP magic bytes", () => {
    const bytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x24, 0x00, 0x00, 0x00, // file size
      0x57, 0x45, 0x42, 0x50, // WEBP
      0x56, 0x50, 0x38, 0x20, // VP8
    ]);
    expect(detectImageFormat(bytes)).toBe("webp");
  });

  it("rejects truncated byte sequences (< 12 bytes)", () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff]);
    expect(() => detectImageFormat(bytes)).toThrow(ImageValidationError);
  });

  it("rejects non-image files such as HTML or JavaScript polyglots", () => {
    const htmlBytes = new TextEncoder().encode("<!DOCTYPE html><html><body>malicious</body></html>");
    expect(() => detectImageFormat(htmlBytes)).toThrow(ImageValidationError);

    const exeBytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00]);
    expect(() => detectImageFormat(exeBytes)).toThrow(ImageValidationError);
  });
});

describe("validateImageDimensions", () => {
  it("accepts normal avatar dimensions", () => {
    expect(() => validateImageDimensions(500, 500)).not.toThrow();
    expect(() => validateImageDimensions(1920, 1080)).not.toThrow();
    expect(() => validateImageDimensions(100, 100)).not.toThrow();
  });

  it("rejects non-positive and non-finite dimensions", () => {
    expect(() => validateImageDimensions(0, 500)).toThrow(ImageValidationError);
    expect(() => validateImageDimensions(500, -10)).toThrow(ImageValidationError);
    expect(() => validateImageDimensions(NaN, 500)).toThrow(ImageValidationError);
    expect(() => validateImageDimensions(500, Infinity)).toThrow(ImageValidationError);
  });

  it("rejects decompression bombs exceeding MAX_INPUT_PIXELS", () => {
    // 5000 x 5000 = 25,000,000 pixels > 16,000,000
    expect(() => validateImageDimensions(5000, 5000)).toThrow(/resolution is too high/);
  });

  it("rejects abnormal aspect ratios", () => {
    // 25:1 aspect ratio exceeds 20:1 max
    expect(() => validateImageDimensions(2500, 100)).toThrow(/aspect ratio/);
    expect(() => validateImageDimensions(100, 2500)).toThrow(/aspect ratio/);
  });
});

describe("calculateTargetDimensions", () => {
  it("does not scale up smaller images", () => {
    const result = calculateTargetDimensions(200, 300, 512);
    expect(result).toEqual({ width: 200, height: 300, scaled: false });
  });

  it("scales down large landscape images preserving aspect ratio", () => {
    // 1024 x 768 scaled down to max 512: scale = 512/1024 = 0.5 -> 512 x 384
    const result = calculateTargetDimensions(1024, 768, 512);
    expect(result).toEqual({ width: 512, height: 384, scaled: true });
  });

  it("scales down large portrait images preserving aspect ratio", () => {
    // 800 x 1600 scaled down to max 512: scale = 512/1600 = 0.32 -> 256 x 512
    const result = calculateTargetDimensions(800, 1600, 512);
    expect(result).toEqual({ width: 256, height: 512, scaled: true });
  });

  it("scales down square images exactly to max dimension", () => {
    const result = calculateTargetDimensions(2000, 2000, 512);
    expect(result).toEqual({ width: 512, height: 512, scaled: true });
  });
});

describe("generateSafeAvatarFilename", () => {
  it("generates clean filenames without path traversal", () => {
    const name = generateSafeAvatarFilename("webp");
    expect(name).toMatch(/^avatar-\d+-[a-z0-9]+\.webp$/);
  });

  it("sanitizes dangerous extensions", () => {
    const name = generateSafeAvatarFilename("../../../etc/passwd");
    expect(name).not.toContain("/");
    expect(name).not.toContain("..");
  });
});
