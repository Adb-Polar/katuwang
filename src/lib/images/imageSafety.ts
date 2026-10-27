import { MAGIC_BYTES, IMAGE_CONFIG, type SupportedImageFormat } from "./imageConfig";

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageValidationError";
  }
}

/**
 * Detect image format from file header magic bytes.
 * Validates actual file content signature rather than trusting user-supplied extensions or MIME types.
 */
export function detectImageFormat(headerBytes: Uint8Array | number[]): SupportedImageFormat {
  if (headerBytes.length < 12) {
    throw new ImageValidationError("Image file is too small or truncated.");
  }

  // Check JPEG: starts with FF D8 FF
  if (
    headerBytes[0] === MAGIC_BYTES.JPEG[0] &&
    headerBytes[1] === MAGIC_BYTES.JPEG[1] &&
    headerBytes[2] === MAGIC_BYTES.JPEG[2]
  ) {
    return "jpeg";
  }

  // Check PNG: starts with 89 50 4E 47 0D 0A 1A 0A
  const isPng = MAGIC_BYTES.PNG.every((byte, idx) => headerBytes[idx] === byte);
  if (isPng) {
    return "png";
  }

  // Check WebP: RIFF at offset 0-3 and WEBP at offset 8-11
  const isRiff = MAGIC_BYTES.WEBP_RIFF.every((byte, idx) => headerBytes[idx] === byte);
  const isWebp = MAGIC_BYTES.WEBP_FORMAT.every((byte, idx) => headerBytes[8 + idx] === byte);
  if (isRiff && isWebp) {
    return "webp";
  }

  throw new ImageValidationError(
    "Invalid image format. Supported formats are JPEG, PNG, and WebP."
  );
}

/**
 * Validate image dimensions against decompression bombs and abnormal aspect ratios.
 */
export function validateImageDimensions(width: number, height: number): void {
  if (width <= 0 || height <= 0 || !Number.isFinite(width) || !Number.isFinite(height)) {
    throw new ImageValidationError("Image dimensions must be positive finite numbers.");
  }

  const totalPixels = width * height;
  if (totalPixels > IMAGE_CONFIG.MAX_INPUT_PIXELS) {
    throw new ImageValidationError(
      `Image resolution is too high (${width}x${height} = ${Math.round(
        totalPixels / 1_000_000
      )}MP). Maximum allowed is 16MP.`
    );
  }

  const aspectRatio = Math.max(width / height, height / width);
  if (aspectRatio > IMAGE_CONFIG.MAX_ASPECT_RATIO) {
    throw new ImageValidationError(
      `Image aspect ratio (${aspectRatio.toFixed(1)}:1) is abnormal. Maximum allowed is ${IMAGE_CONFIG.MAX_ASPECT_RATIO}:1.`
    );
  }
}

/**
 * Calculate scaled dimensions fitting within maxDimension while preserving aspect ratio.
 */
export function calculateTargetDimensions(
  width: number,
  height: number,
  maxDimension: number = IMAGE_CONFIG.MAX_AVATAR_DIMENSION
): { width: number; height: number; scaled: boolean } {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height, scaled: false };
  }

  const scale = Math.min(maxDimension / width, maxDimension / height);
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  return { width: targetWidth, height: targetHeight, scaled: true };
}

/**
 * Generate a safe storage filename for optimized avatars, preventing directory traversal or script execution.
 */
export function generateSafeAvatarFilename(extension: string = "webp"): string {
  const cleanExt = extension.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "webp";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `avatar-${timestamp}-${random}.${cleanExt}`;
}
