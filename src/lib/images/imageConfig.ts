/**
 * Central configuration for image processing, dimension limits, and upload safety.
 * Single source of truth for both client-side and server-side optimization.
 */

export const IMAGE_CONFIG = {
  /** Maximum allowable raw upload file size in bytes (2MB) */
  MAX_UPLOAD_BYTES: 2 * 1024 * 1024,

  /** Maximum bounding dimension (width/height) for user profile avatars */
  MAX_AVATAR_DIMENSION: 512,

  /** Maximum allowed input pixels to prevent decompression bombs (16 megapixels) */
  MAX_INPUT_PIXELS: 16_000_000,

  /** Maximum allowed aspect ratio to reject abnormal dimension strips (e.g. 20:1) */
  MAX_ASPECT_RATIO: 20,

  /** WebP compression quality (0-100) — optimal balance of visual fidelity & file size */
  WEBP_QUALITY: 80,

  /** JPEG fallback compression quality (0-100) */
  JPEG_QUALITY: 80,

  /** Supported MIME types for uploads */
  ALLOWED_MIME_TYPES: ["image/jpeg", "image/png", "image/webp"] as const,

  /** Allowed file extensions */
  ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp"] as const,
} as const;

export type SupportedImageFormat = "jpeg" | "png" | "webp";

/**
 * Known magic byte signatures for image format verification
 */
export const MAGIC_BYTES = {
  JPEG: [0xff, 0xd8, 0xff],
  PNG: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  WEBP_RIFF: [0x52, 0x49, 0x46, 0x46], // "RIFF"
  WEBP_FORMAT: [0x57, 0x45, 0x42, 0x50], // "WEBP"
} as const;
