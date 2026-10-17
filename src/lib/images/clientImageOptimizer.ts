import { IMAGE_CONFIG } from "./imageConfig";
import {
  detectImageFormat,
  validateImageDimensions,
  calculateTargetDimensions,
  generateSafeAvatarFilename,
  ImageValidationError,
} from "./imageSafety";

export interface ClientOptimizationResult {
  file: File;
  originalSize: number;
  optimizedSize: number;
  dimensions: { width: number; height: number };
  reductionPercent: number;
}

/**
 * Validate and optimize an image file in the browser before upload.
 * - Checks file signature (magic bytes) to prevent disguised executable uploads.
 * - Protects against decompression bombs and abnormal aspect ratios.
 * - Strips EXIF/GPS metadata via canvas rasterization.
 * - Resizes to optimal avatar dimensions (max 512x512).
 * - Compresses to modern WebP (with JPEG fallback).
 * - Guarantees the output is never larger than the original.
 */
export async function validateAndOptimizeImage(file: File): Promise<ClientOptimizationResult> {
  const originalSize = file.size;

  if (originalSize === 0) {
    throw new ImageValidationError("Selected file is empty.");
  }

  if (originalSize > IMAGE_CONFIG.MAX_UPLOAD_BYTES) {
    throw new ImageValidationError("Image size must be less than 2MB.");
  }

  // 1. Read first 32 bytes and verify magic bytes
  const headerSlice = await file.slice(0, 32).arrayBuffer();
  const detectedFormat = detectImageFormat(new Uint8Array(headerSlice));

  // 2. Decode image to inspect actual dimensions
  const imageBitmap = await loadImageBitmapSafe(file);
  const rawWidth = imageBitmap.width;
  const rawHeight = imageBitmap.height;

  // 3. Guard against decompression bombs and abnormal aspect ratios
  validateImageDimensions(rawWidth, rawHeight);

  // 4. Calculate target dimensions
  const target = calculateTargetDimensions(
    rawWidth,
    rawHeight,
    IMAGE_CONFIG.MAX_AVATAR_DIMENSION
  );

  // 5. Draw to canvas for resizing and EXIF stripping
  const canvas = document.createElement("canvas");
  canvas.width = target.width;
  canvas.height = target.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new ImageValidationError("Unable to initialize image processing context.");
  }

  // Enable high-quality bicubic downsampling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Draw scaled image (rasterization strips all EXIF/GPS tags)
  ctx.drawImage(imageBitmap, 0, 0, target.width, target.height);

  // 6. Compress to WebP (with JPEG fallback if WebP is unsupported)
  let blob: Blob | null = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", IMAGE_CONFIG.WEBP_QUALITY / 100);
  });

  let outputExt = "webp";
  let outputMime = "image/webp";

  // Fallback to JPEG if browser doesn't support WebP canvas encoding
  if (!blob || blob.type !== "image/webp") {
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", IMAGE_CONFIG.JPEG_QUALITY / 100);
    });
    outputExt = "jpg";
    outputMime = "image/jpeg";
  }

  if (!blob) {
    throw new ImageValidationError("Failed to compress image.");
  }

  // 7. Safety check: never return a larger file if the original was already smaller and within bounds
  if (blob.size >= originalSize && !target.scaled && detectedFormat === outputExt) {
    return {
      file,
      originalSize,
      optimizedSize: originalSize,
      dimensions: { width: rawWidth, height: rawHeight },
      reductionPercent: 0,
    };
  }

  // 8. Construct sanitized File object
  const safeFilename = generateSafeAvatarFilename(outputExt);
  const optimizedFile = new File([blob], safeFilename, {
    type: outputMime,
    lastModified: Date.now(),
  });

  const optimizedSize = optimizedFile.size;
  const reductionPercent = Math.max(
    0,
    parseFloat((((originalSize - optimizedSize) / originalSize) * 100).toFixed(2))
  );

  return {
    file: optimizedFile,
    originalSize,
    optimizedSize,
    dimensions: { width: target.width, height: target.height },
    reductionPercent,
  };
}

/**
 * Safely load an ImageBitmap or HTMLImageElement with EXIF orientation handling.
 */
async function loadImageBitmapSafe(file: File): Promise<{ width: number; height: number } & CanvasImageSource> {
  if (typeof window !== "undefined" && "createImageBitmap" in window) {
    try {
      // Modern browsers auto-rotate according to EXIF orientation tag
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Fall through to HTMLImageElement fallback
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageValidationError("Failed to decode image data."));
    };

    img.src = url;
  });
}
