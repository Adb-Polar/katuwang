import sharp from "sharp";
import { IMAGE_CONFIG } from "./imageConfig";
import {
  detectImageFormat,
  validateImageDimensions,
  calculateTargetDimensions,
  ImageValidationError,
} from "./imageSafety";

export interface ServerOptimizationResult {
  buffer: Buffer;
  format: "webp" | "png" | "jpeg";
  width: number;
  height: number;
  originalSize: number;
  optimizedSize: number;
  reductionPercent: number;
  mimeType: string;
}

export interface ServerOptimizationOptions {
  maxDimension?: number;
  quality?: number;
  forceWebp?: boolean;
}

/**
 * Optimize an image buffer server-side using Sharp.
 * Validates magic bytes, checks for decompression bombs, auto-orients by EXIF,
 * strips sensitive metadata, resizes to avatar bounds, and encodes to WebP/PNG.
 */
export async function optimizeImageBuffer(
  inputBuffer: Buffer,
  options: ServerOptimizationOptions = {}
): Promise<ServerOptimizationResult> {
  const originalSize = inputBuffer.length;

  if (originalSize === 0) {
    throw new ImageValidationError("Image buffer is empty.");
  }

  if (originalSize > IMAGE_CONFIG.MAX_UPLOAD_BYTES) {
    throw new ImageValidationError(
      `Image size (${(originalSize / (1024 * 1024)).toFixed(2)}MB) exceeds maximum limit of 2MB.`
    );
  }

  // 1. Validate file signature magic bytes
  const headerSlice = inputBuffer.subarray(0, 32);
  const detectedFormat = detectImageFormat(new Uint8Array(headerSlice));

  // 2. Load into Sharp with decompression bomb guard
  let sharpInstance = sharp(inputBuffer, {
    failOn: "error",
    limitInputPixels: IMAGE_CONFIG.MAX_INPUT_PIXELS,
  });

  const metadata = await sharpInstance.metadata();
  const rawWidth = metadata.width;
  const rawHeight = metadata.height;

  if (!rawWidth || !rawHeight) {
    throw new ImageValidationError("Unable to determine image dimensions.");
  }

  // 3. Validate dimensions and aspect ratio
  validateImageDimensions(rawWidth, rawHeight);

  // 4. Calculate target dimensions
  const maxDim = options.maxDimension ?? IMAGE_CONFIG.MAX_AVATAR_DIMENSION;
  const target = calculateTargetDimensions(rawWidth, rawHeight, maxDim);

  // 5. Auto-orient by EXIF orientation tag, then strip all metadata (GPS, EXIF, camera info)
  sharpInstance = sharpInstance.rotate();

  // 6. Resize if larger than target dimensions
  if (target.scaled) {
    sharpInstance = sharpInstance.resize({
      width: target.width,
      height: target.height,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  // 7. Choose output format & compression
  const quality = options.quality ?? IMAGE_CONFIG.WEBP_QUALITY;
  const forceWebp = options.forceWebp ?? true;

  let outputBuffer: Buffer;
  let outputFormat: "webp" | "png" | "jpeg" = "webp";
  let mimeType = "image/webp";

  if (forceWebp) {
    outputBuffer = await sharpInstance
      .webp({
        quality,
        effort: 4, // Good balance of compression speed and file size
      })
      .toBuffer();
    outputFormat = "webp";
    mimeType = "image/webp";
  } else if (metadata.hasAlpha && detectedFormat === "png") {
    outputBuffer = await sharpInstance
      .png({
        compressionLevel: 9,
        palette: true,
      })
      .toBuffer();
    outputFormat = "png";
    mimeType = "image/png";
  } else {
    outputBuffer = await sharpInstance
      .jpeg({
        quality,
        mozjpeg: true,
      })
      .toBuffer();
    outputFormat = "jpeg";
    mimeType = "image/jpeg";
  }

  // 8. Ensure output is not larger than original if dimensions were already within bounds
  if (outputBuffer.length >= originalSize && !target.scaled && detectedFormat === outputFormat) {
    // If output is somehow larger and dimensions were unchanged, keep the original
    return {
      buffer: inputBuffer,
      format: detectedFormat,
      width: rawWidth,
      height: rawHeight,
      originalSize,
      optimizedSize: originalSize,
      reductionPercent: 0,
      mimeType: detectedFormat === "jpeg" ? "image/jpeg" : `image/${detectedFormat}`,
    };
  }

  // Retrieve actual output dimensions
  const outputMetadata = await sharp(outputBuffer).metadata();
  const finalWidth = outputMetadata.width ?? target.width;
  const finalHeight = outputMetadata.height ?? target.height;
  const optimizedSize = outputBuffer.length;
  const reductionPercent = Math.max(
    0,
    parseFloat((((originalSize - optimizedSize) / originalSize) * 100).toFixed(2))
  );

  return {
    buffer: outputBuffer,
    format: outputFormat,
    width: finalWidth,
    height: finalHeight,
    originalSize,
    optimizedSize,
    reductionPercent,
    mimeType,
  };
}
