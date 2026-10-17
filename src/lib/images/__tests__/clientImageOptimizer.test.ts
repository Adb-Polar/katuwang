import { describe, it, expect } from "vitest";
import { validateAndOptimizeImage } from "../clientImageOptimizer";
import { ImageValidationError } from "../imageSafety";

describe("clientImageOptimizer", () => {
  it("rejects empty files with ImageValidationError", async () => {
    const emptyFile = new File([], "empty.png", { type: "image/png" });
    await expect(validateAndOptimizeImage(emptyFile)).rejects.toThrow(ImageValidationError);
  });

  it("rejects files exceeding 2MB size limit", async () => {
    const largeBlob = new Blob([new Uint8Array(2.5 * 1024 * 1024)]);
    const largeFile = new File([largeBlob], "huge.jpg", { type: "image/jpeg" });
    await expect(validateAndOptimizeImage(largeFile)).rejects.toThrow(/less than 2MB/);
  });

  it("rejects files with invalid header signatures (e.g. text/html)", async () => {
    const textBlob = new Blob(["<!DOCTYPE html><html><body>malicious</body></html>"], {
      type: "image/png",
    });
    const fakeImageFile = new File([textBlob], "not-an-image.png", { type: "image/png" });
    await expect(validateAndOptimizeImage(fakeImageFile)).rejects.toThrow(ImageValidationError);
  });
});
