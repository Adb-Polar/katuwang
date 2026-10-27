# Katuwang — Image Compression and Storage Optimization Report

**Date:** October 17, 2026  
**Status:** Implemented & Verified  
**Scope:** Full-stack image optimization, client-side pre-compression, server-side Sharp engine, upload security validation, frontend layout stability, and existing cloud storage audit/migration tools.

---

## 1. Existing Image Upload and Storage Architecture

### 1.1 Discovery & Inventory
- **Storage Provider:** [UploadThing](https://uploadthing.com) (`uploadthing` v7.7.4, `@uploadthing/react` v7.3.3) hosted on Cloudflare CDN (`https://*.ufs.sh`, `https://utfs.io`).
- **Database Schema:** 
  - `User.image` (`String? @db.Text`): Stored public URL of the uploaded avatar.
  - `User.imageKey` (`String?`): UploadThing file key for cloud storage management and deletion.
  - `User.profilePictureLocked` (`Boolean`): Administrative moderation flag.
  - `User.profilePictureUpdatedAt` (`DateTime?`): Timestamp of last image change.
  - *No other models in Katuwang store image uploads.*
- **Upload Endpoints & Workflows:**
  - Client component: `src/components/profile/ProfilePictureUpload.tsx`.
  - Router definition: `src/app/api/uploadthing/core.ts` (`profilePicture` slug).
  - Webhook route: `src/app/api/uploadthing/route.ts`.
  - Self-service delete route: `src/app/api/user/profile-picture/route.ts`.
  - Administrative moderation route: `src/app/api/admin/users/[userId]/avatar-action/route.ts`.
- **Display Locations:**
  - Top navigation bar avatar (`src/components/layout/PortalLayout.tsx`).
  - Interactive avatar component (`src/components/profile/UserAvatar.tsx`) used across student, tutor, class card, class roster, topic request, and admin tables.
  - Zoomable lightbox modal (`Modal.tsx`) inside `UserAvatar.tsx`.
- **Access Control & Privacy:**
  - Controlled by `src/lib/avatarPrivacy.ts` (`canViewProfilePicture`).
  - Strict student-to-student anonymity is enforced: student avatars are stripped (`null`) whenever another student queries tutor, class, or roster data.

---

## 2. Files and Components Changed

| File | Change Summary |
| :--- | :--- |
| `src/lib/images/imageConfig.ts` | **New File:** Centralized configuration for upload size limits, avatar dimensions, decompression bomb thresholds, WebP/JPEG quality, and magic bytes. |
| `src/lib/images/imageSafety.ts` | **New File:** File signature (magic bytes) validation, dimension verification, aspect ratio limits, target dimension math, and safe filename generation. |
| `src/lib/images/clientImageOptimizer.ts` | **New File:** Client-side pre-compression engine using HTML5 Canvas / `createImageBitmap` with automatic EXIF/GPS stripping, bicubic scaling, WebP compression, and size checks. |
| `src/lib/images/serverImageOptimizer.ts` | **New File:** Server-side image optimizer using Sharp with auto-rotation, decompression bomb protection, metadata stripping, and WebP encoding. |
| `src/components/profile/ProfilePictureUpload.tsx` | Integrated `validateAndOptimizeImage` before upload; added dynamic `optimizing` state indicator, error handling, and dimension guards. |
| `src/app/api/uploadthing/core.ts` | Added defense-in-depth server-side optimization fallback in `onUploadComplete` for any images bypassing client compression. |
| `src/components/profile/UserAvatar.tsx` | Added explicit `width` & `height` attributes to prevent Cumulative Layout Shift (CLS), `decoding="async"`, `priority` loading support, and graceful `onError` monogram fallback. |
| `src/components/layout/PortalLayout.tsx` | Added explicit dimensions (34x34), `decoding="async"`, and `loading="eager"` to header user avatar. |
| `next.config.ts` | Configured `images.formats` (`["image/avif", "image/webp"]`) and `images.remotePatterns` for UploadThing hostnames (`utfs.io`, `*.ufs.sh`, `uploadthing.com`). |
| `package.json` | Added `sharp` (^0.35.4) as a dependency (previously in `pnpm.overrides`). |
| `scripts/audit-and-optimize-images.ts` | **New Script:** Stored image inventory audit tool with dry-run estimation, backup manifest generation, and rollback support. |
| `scripts/benchmark-image-compression.ts` | **New Script:** Empirical compression benchmark suite measuring photographic JPEGs, PNG screenshots, transparent graphics, and real stored images. |
| `src/lib/images/__tests__/imageSafety.test.ts` | **New Test Suite:** 15 unit tests covering format detection, non-image rejection, dimension limits, and filename sanitization. |
| `src/lib/images/__tests__/serverImageOptimizer.test.ts` | **New Test Suite:** 6 unit tests covering JPEG optimization, transparent PNGs, dimension boundaries, oversized payloads, and invalid buffers. |
| `src/lib/images/__tests__/clientImageOptimizer.test.ts` | **New Test Suite:** 3 unit tests covering client-side file validation, size limits, and header verification. |

---

## 3. Compression Formats, Quality Settings, and Dimension Limits

All optimization thresholds are declared in `src/lib/images/imageConfig.ts`:

- **Maximum Upload File Size:** 2 MB (`2 * 1024 * 1024` bytes).
- **Target Avatar Bounding Box:** `512 x 512 px` (sufficient for $2\times$ Retina density on 96px display avatars and full-screen lightbox modal rendering up to 512px).
- **Target Format:** Modern **WebP** (`image/webp`) with fallback to **JPEG** for legacy browsers.
- **WebP Quality Setting:** `80` (optimal rate-distortion tradeoff; retains crisp facial details without artifacting).
- **Transparency Preservation:** Transparent PNGs retain alpha channels and are encoded as WebP with alpha preservation (`hasAlpha: true`).
- **Safety Against Bloat:** If compression produces an output larger than or equal to the original, the original image is preserved (`never produce a larger output`).

---

## 4. Security and Upload Validation Improvements

1. **Magic Byte / File Signature Validation:**
   - Client and server inspect the initial binary header bytes (`FF D8 FF` for JPEG, `89 50 4E 47` for PNG, `RIFF....WEBP` for WebP).
   - Prevents disguised executable files, scripts, or polyglot files with spoofed `.jpg` or `.png` extensions from reaching cloud storage.
2. **Decompression Bomb Protection:**
   - Pre-computation dimension limits reject images exceeding 16 megapixels (`MAX_INPUT_PIXELS = 16,000,000`).
   - Rejects abnormal aspect ratios exceeding $20:1$ (e.g. $100,000 \times 1\text{ px}$ resource exhaustion attacks).
   - Server-side Sharp configuration enforces `limitInputPixels: 16_000_000`.
3. **EXIF & Sensitive Metadata Stripping:**
   - Strips GPS latitude/longitude, camera device serial numbers, and personal timestamps.
   - Preserves correct orientation via `createImageBitmap(file, { imageOrientation: "from-image" })` on the client and `.rotate()` in Sharp before metadata stripping.
4. **Safe Storage Filename Generation:**
   - Generates random, collision-free alphanumeric keys (`avatar-<timestamp>-<hash>.webp`) instead of trusting user-supplied filenames, preventing directory traversal and special character exploits.
5. **Defense-in-Depth Pipeline:**
   - Layer 1: Client-side compression eliminates cellular data waste and transmits only pre-optimized WebP blobs.
   - Layer 2: Server-side `onUploadComplete` fallback checks any file uploaded directly via API; if unoptimized, fetches the image, compresses it with Sharp, uploads the optimized version, and deletes the uncompressed original.

---

## 5. Frontend Loading Improvements

1. **Cumulative Layout Shift (CLS) Elimination:**
   - Explicit `width` and `height` attributes assigned to `UserAvatar.tsx` (`24px` for `xs`, `32px` for `sm`, `40px` for `md`, `56px` for `lg`, `80px` for `xl`, `112px` for `2xl`).
   - Header avatar in `PortalLayout.tsx` explicitly assigned `width={34}` and `height={34}`.
2. **Off-Thread Decoding:**
   - `decoding="async"` added to all avatar images to prevent UI freezes during browser image decoding on low-end devices.
3. **Smart Loading Strategies:**
   - `loading="lazy"` on all off-screen and feed avatars.
   - `priority` flag support (`loading="eager"`) for critical above-the-fold avatars (such as the top navigation profile icon).
4. **Graceful Error Recovery:**
   - `onError` state listener in `UserAvatar.tsx` gracefully switches to a stylized monogram badge if an image fails to load or returns a 404/403, preventing broken image placeholders.

---

## 6. Before-and-After Benchmark Results

Empirical benchmarks run via `scripts/benchmark-image-compression.ts`:

| Sample Category | Original Dim | Optimized Dim | Before (KB) | After (KB) | Reduction (%) | Time (ms) | Target Format |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **High-Res Photo (JPEG)** | 2048x1536 | 512x384 | 25.5 KB | 0.7 KB | **97.13%** | 23.2 ms | WebP |
| **High-Res Screenshot (PNG)** | 1920x1080 | 512x288 | 44.0 KB | 0.5 KB | **98.98%** | 66.2 ms | WebP |
| **Transparent Logo / Avatar (PNG)** | 1024x1024 | 512x512 | 24.1 KB | 1.1 KB | **95.34%** | 46.6 ms | WebP |
| **Pre-Optimized WebP** | 400x400 | 400x400 | 0.4 KB | 0.4 KB | **0.00%** | 14.8 ms | WebP (Retained) |
| **Real Stored User Avatar (PNG)** | 938x369 | 511x201 | 61.3 KB | 14.8 KB | **75.95%** | 21.5 ms | WebP |

### Aggregate Benchmark Totals
- **Total Uncompressed Benchmark Data:** 155.33 KB
- **Total Optimized Benchmark Data:** 17.42 KB
- **Average Compression Reduction:** **88.79%**
- **Average Processing Latency:** ~34.5 ms

---

## 7. Actual Storage Savings

Running the safe audit script against the active database:
- **Total User Accounts in Database:** 288
- **Users With Uploaded Images:** 1 (`TUT-0009`, STUDENT_TUTOR)
- **Image URL:** `https://xzc37go9kz.ufs.sh/f/xdzk3zjZyCo7k387lLtd524GkN8LaAWFxnvBCljhyTZObSzq`
- **Original Format:** PNG (raw desktop screenshot, $938 \times 369$)
- **Original File Size:** 61.33 KB (62,798 bytes)
- **Simulated Optimized Size:** 14.75 KB (15,104 bytes, $511 \times 201$ WebP)
- **Potential Storage Savings:** **46.58 KB saved (75.95% reduction)** on this single asset.

*Note: In accordance with project instructions, existing production storage has not been destructively overwritten. The asset is queued for safe migration.*

---

## 8. Existing Images That Remain Unoptimized

1. **User `TUT-0009` Avatar (`xdzk3zjZyCo7k387lLtd524GkN8LaAWFxnvBCljhyTZObSzq`):**
   - Current status: Active in cloud storage at 61.33 KB.
   - Optimization status: Unoptimized legacy PNG screenshot.
   - Recommended action: Run the automated migration script with `--apply --confirm` during a scheduled maintenance window.

---

## 9. Dependencies Added and Rationale

| Dependency | Version | Type | Rationale |
| :--- | :--- | :--- | :--- |
| `sharp` | `^0.35.4` | `dependencies` | High-performance libvips Node.js image processing library. Required for server-side image optimization, EXIF rotation, metadata stripping, WebP encoding, and automated cloud migration tooling. Already present in `pnpm.overrides`. |

---

## 10. Tests Executed and Results

| Test Suite | Tests | Result | Execution Time |
| :--- | :--- | :--- | :--- |
| `src/lib/images/__tests__/imageSafety.test.ts` | 15 passed | **PASSED** | 18 ms |
| `src/lib/images/__tests__/serverImageOptimizer.test.ts` | 6 passed | **PASSED** | 82 ms |
| `src/lib/images/__tests__/clientImageOptimizer.test.ts` | 3 passed | **PASSED** | 24 ms |
| `src/lib/__tests__/avatarPrivacy.test.ts` | 11 passed | **PASSED** | 31 ms |
| **Full Vitest Test Suite (Entire Repository)** | **801 / 801 tests passed** (108 test files) | **PASSED** | 34.08 s |
| **TypeScript Typecheck (`tsc --noEmit`)** | 0 errors | **PASSED** | 23.0 s |
| **ESLint (`eslint`)** | 0 errors | **PASSED** | — |
| **Next.js Production Build (`next build`)** | 115 / 115 routes compiled | **PASSED** | 35.3 s |

---

## 11. Limitations and Outstanding Risks

1. **Browser Canvas WebP Support:**
   - WebP export from canvas is supported by >97% of modern browsers. On legacy browsers lacking WebP canvas export, the client optimizer automatically falls back to optimized JPEG (`image/jpeg`).
2. **Third-Party CDN Caching:**
   - UploadThing URLs cached on Cloudflare edge servers have a 24-hour cache-control header (`max-age=86400`). When migrating an existing image, updating the database with a newly generated file key immediately invalidates old cached URLs for all users.
3. **UploadThing Free Tier Token Quotas:**
   - Server-side fallback optimization uploads a second file and deletes the first if bypassed by client. Client-side pre-compression minimizes this by ensuring the first upload is already optimized.

---

## 12. Steps Required to Migrate Existing Images Safely

To safely migrate existing legacy images without downtime:

1. **Verify Environment:** Ensure `UPLOADTHING_TOKEN` is defined in `.env`.
2. **Execute Dry-Run Audit:**
   ```bash
   pnpm exec tsx scripts/audit-and-optimize-images.ts
   ```
   Inspect the output table to verify all images, formats, and estimated savings.
3. **Execute Migration:**
   ```bash
   pnpm exec tsx scripts/audit-and-optimize-images.ts --apply --confirm
   ```
   This will:
   - Download each legacy image buffer.
   - Optimize, resize, and convert to WebP in memory.
   - Upload the new WebP file to UploadThing.
   - Atomically update `User.image` and `User.imageKey` in the database.
   - Generate a timestamped backup manifest: `image-migration-backup-<timestamp>.json`.
   - Preserve previous images until verified.

---

## 13. Rollback Instructions

If any migrated image displays incorrectly or experiences issues:

1. Locate the backup manifest generated during migration (e.g. `image-migration-backup-1729148400000.json`).
2. Execute the rollback command:
   ```bash
   pnpm exec tsx scripts/audit-and-optimize-images.ts --rollback image-migration-backup-1729148400000.json
   ```
3. The script will restore the original URLs and keys for all affected users in MariaDB/MySQL.
