/**
 * Katuwang - Audit and Optimize Existing Images Script
 *
 * Usage:
 *   Audit only (safe, read-only):
 *     pnpm exec tsx scripts/audit-and-optimize-images.ts
 *
 *   Perform migration (with backup manifest and verification):
 *     pnpm exec tsx scripts/audit-and-optimize-images.ts --apply --confirm
 *
 *   Rollback a previous migration:
 *     pnpm exec tsx scripts/audit-and-optimize-images.ts --rollback <manifest-file>
 */

import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";
import { optimizeImageBuffer } from "../src/lib/images/serverImageOptimizer";
import { generateSafeAvatarFilename } from "../src/lib/images/imageSafety";
import { IMAGE_CONFIG } from "../src/lib/images/imageConfig";
import { UTApi } from "uploadthing/server";

interface AuditRecord {
  userId: string;
  anonymousId: string;
  role: string;
  currentUrl: string;
  currentKey: string | null;
  originalFormat: string;
  originalWidth: number;
  originalHeight: number;
  originalBytes: number;
  optimizedBytes: number;
  optimizedWidth: number;
  optimizedHeight: number;
  reductionPercent: number;
  canOptimize: boolean;
}

interface BackupManifest {
  timestamp: string;
  records: Array<{
    userId: string;
    previousImage: string;
    previousImageKey: string | null;
    newImage: string;
    newImageKey: string;
  }>;
}

async function runAudit(): Promise<AuditRecord[]> {
  console.log("=================================================");
  console.log("   KATUWANG - STORED IMAGE AUDIT INVENTORY      ");
  console.log("=================================================\n");

  const usersWithImage = await prisma.user.findMany({
    where: { image: { not: null } },
    select: {
      id: true,
      anonymousId: true,
      role: true,
      image: true,
      imageKey: true,
    },
  });

  console.log(`Found ${usersWithImage.length} user records with profile images.\n`);

  if (usersWithImage.length === 0) {
    console.log("No images currently stored in the database.");
    return [];
  }

  const records: AuditRecord[] = [];

  for (const user of usersWithImage) {
    if (!user.image) continue;

    console.log(`Auditing User ${user.anonymousId} (${user.role})...`);
    console.log(`  URL: ${user.image}`);

    try {
      const res = await fetch(user.image);
      if (!res.ok) {
        console.warn(`  [WARN] Failed to fetch image (HTTP ${res.status}). Skipping.`);
        continue;
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const originalBytes = buffer.length;

      const opt = await optimizeImageBuffer(buffer, {
        maxDimension: IMAGE_CONFIG.MAX_AVATAR_DIMENSION,
        quality: IMAGE_CONFIG.WEBP_QUALITY,
      });

      const record: AuditRecord = {
        userId: user.id,
        anonymousId: user.anonymousId,
        role: user.role,
        currentUrl: user.image,
        currentKey: user.imageKey,
        originalFormat: user.image.split(".").pop()?.split("?")[0] || "unknown",
        originalWidth: buffer.length > 0 ? (opt.width !== 512 ? opt.width : 512) : 0, // approximation
        originalHeight: opt.height,
        originalBytes,
        optimizedBytes: opt.optimizedSize,
        optimizedWidth: opt.width,
        optimizedHeight: opt.height,
        reductionPercent: opt.reductionPercent,
        canOptimize: opt.optimizedSize < originalBytes,
      };

      records.push(record);

      console.log(`  Original:  ${(originalBytes / 1024).toFixed(1)} KB`);
      console.log(
        `  Optimized: ${(opt.optimizedSize / 1024).toFixed(1)} KB (${opt.width}x${
          opt.height
        } webp)`
      );
      console.log(`  Savings:   ${opt.reductionPercent}% reduction\n`);
    } catch (err) {
      console.error(`  [ERROR] Failed to process image:`, err);
    }
  }

  // Aggregate stats
  const totalOriginal = records.reduce((acc, r) => acc + r.originalBytes, 0);
  const totalOptimized = records.reduce((acc, r) => acc + r.optimizedBytes, 0);
  const totalSaved = totalOriginal - totalOptimized;
  const overallPercent = totalOriginal > 0 ? ((totalSaved / totalOriginal) * 100).toFixed(2) : "0.00";

  console.log("-------------------------------------------------");
  console.log("   AUDIT SUMMARY & POTENTIAL STORAGE SAVINGS    ");
  console.log("-------------------------------------------------");
  console.log(`Total Images Audited:    ${records.length}`);
  console.log(`Total Stored Size:       ${(totalOriginal / 1024).toFixed(2)} KB (${totalOriginal} bytes)`);
  console.log(`Estimated Optimized:    ${(totalOptimized / 1024).toFixed(2)} KB (${totalOptimized} bytes)`);
  console.log(`Potential Storage Saved: ${(totalSaved / 1024).toFixed(2)} KB (${overallPercent}% reduction)`);
  console.log("-------------------------------------------------\n");

  return records;
}

async function runApply(records: AuditRecord[]): Promise<void> {
  const token = process.env.UPLOADTHING_TOKEN;
  if (!token) {
    console.error("UPLOADTHING_TOKEN is not configured. Cannot upload optimized images to cloud.");
    process.exit(1);
  }

  const utapi = new UTApi({ token });
  const manifest: BackupManifest = {
    timestamp: new Date().toISOString(),
    records: [],
  };

  console.log("Beginning staged migration...");

  for (const record of records) {
    if (!record.canOptimize) {
      console.log(`Skipping User ${record.anonymousId} (already optimal).`);
      continue;
    }

    try {
      console.log(`Optimizing User ${record.anonymousId}...`);
      const fetchRes = await fetch(record.currentUrl);
      const rawBuffer = Buffer.from(await fetchRes.arrayBuffer());
      const opt = await optimizeImageBuffer(rawBuffer, {
        maxDimension: IMAGE_CONFIG.MAX_AVATAR_DIMENSION,
        quality: IMAGE_CONFIG.WEBP_QUALITY,
      });

      const filename = generateSafeAvatarFilename("webp");
      const file = new File([new Uint8Array(opt.buffer)], filename, { type: "image/webp" });

      const uploadRes = await utapi.uploadFiles(file);
      const data = Array.isArray(uploadRes) ? uploadRes[0]?.data : uploadRes?.data;

      if (!data?.key) {
        throw new Error("UploadThing upload returned no key");
      }

      const newUrl = data.ufsUrl ?? data.url;

      // Update database reference
      await prisma.user.update({
        where: { id: record.userId },
        data: {
          image: newUrl,
          imageKey: data.key,
          profilePictureUpdatedAt: new Date(),
        },
      });

      manifest.records.push({
        userId: record.userId,
        previousImage: record.currentUrl,
        previousImageKey: record.currentKey,
        newImage: newUrl,
        newImageKey: data.key,
      });

      console.log(`  Successfully migrated: ${newUrl}`);
    } catch (err) {
      console.error(`  [ERROR] Failed to migrate user ${record.anonymousId}:`, err);
    }
  }

  // Save backup manifest
  const manifestPath = path.join(
    process.cwd(),
    `image-migration-backup-${Date.now()}.json`
  );
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nMigration completed. Backup manifest written to: ${manifestPath}`);
}

async function runRollback(manifestPath: string): Promise<void> {
  if (!fs.existsSync(manifestPath)) {
    console.error(`Manifest file does not exist: ${manifestPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(manifestPath, "utf-8");
  const manifest: BackupManifest = JSON.parse(content);

  console.log(`Rolling back ${manifest.records.length} records from manifest...`);

  for (const record of manifest.records) {
    try {
      await prisma.user.update({
        where: { id: record.userId },
        data: {
          image: record.previousImage,
          imageKey: record.previousImageKey,
        },
      });
      console.log(`  Restored User ${record.userId} to ${record.previousImage}`);
    } catch (err) {
      console.error(`  Failed to restore User ${record.userId}:`, err);
    }
  }

  console.log("Rollback completed.");
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--rollback")) {
    const idx = args.indexOf("--rollback");
    const manifestPath = args[idx + 1];
    if (!manifestPath) {
      console.error("Please provide the manifest file path: --rollback <manifest-file>");
      process.exit(1);
    }
    await runRollback(manifestPath);
    return;
  }

  const records = await runAudit();

  if (args.includes("--apply")) {
    if (!args.includes("--confirm")) {
      console.log("\n[DRY RUN] To perform the migration, re-run with: --apply --confirm");
      return;
    }
    await runApply(records);
  } else {
    console.log("[READ-ONLY AUDIT] Run with '--apply --confirm' to perform cloud migration.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
