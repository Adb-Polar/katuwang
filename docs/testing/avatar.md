# Katuwang — Feature Testing Checklist (`feature/avatar-uploadthing`)

This checklist covers all features, privacy controls, compression pipelines, and moderation workflows implemented in the `feature/avatar-uploadthing` branch.

---

## Prerequisites & Environment Setup

Before starting manual verification:
1. Ensure your local database is running: `pnpm db:local`
2. Ensure migrations are applied: `pnpm db:status` (or `pnpm db:deploy`)
3. Ensure `.env` contains:
   - `DATABASE_URL` / `LOCAL_DATABASE_URL`
   - `NEXTAUTH_SECRET` & `NEXTAUTH_URL`
   - `UPLOADTHING_TOKEN` (valid token from UploadThing dashboard)
4. Start the development server: `pnpm dev`
5. Test accounts:
   - **Student Learner:** (e.g., Grade 9 / Grade 10 learner)
   - **Student Tutor:** (e.g., `TUT-0009` or another tutor)
   - **Administrator:** (Admin account)

---

## 1. Profile Picture Upload & Self-Service Management

- [ ] **1.1 Fresh Avatar Upload (PNG / JPEG)**
  - **Steps:** Log in as a Student or Tutor $\rightarrow$ Navigate to **Profile** (`/learner/profile` or `/tutor/profile`) $\rightarrow$ Click **Edit details** $\rightarrow$ Click **Upload photo** $\rightarrow$ Select a standard photo (JPEG or PNG under 2MB).
  - **Expected:**
    - Loading indicator displays `"Optimizing..."` while client pre-compresses the image.
    - Progress percentage counts up as it uploads to UploadThing.
    - Success banner displays: `"Profile picture updated successfully."`
    - Avatar preview immediately updates with the new photo.
    - The top navigation bar avatar also refreshes without requiring a full page reload.

- [ ] **1.2 Change Existing Photo**
  - **Steps:** On the profile edit page, click **Change photo** $\rightarrow$ Select a different image file.
  - **Expected:**
    - Photo updates to the new image.
    - Previous image in UploadThing cloud storage is safely replaced/cleaned up.
    - Database record `User.profilePictureUpdatedAt` is updated.

- [ ] **1.3 Self-Service Avatar Removal**
  - **Steps:** On the profile edit page with an active avatar, click the red **Remove** button.
  - **Expected:**
    - Confirmation/loading spinner appears on the button.
    - Success banner displays: `"Profile picture removed."`
    - Avatar reverts to the default monogram badge with user initials.
    - Top navigation bar avatar reverts to initials.
    - Database fields `image` and `imageKey` are set to `null`.

---

## 2. Automatic Compression & Upload Security Validation

- [ ] **2.1 High-Resolution Image Compression (<512px WebP)**
  - **Steps:** Upload a high-resolution camera photo (e.g., $2000 \times 1500$ JPEG, ~1.5MB).
  - **Expected:**
    - Client canvas downsamples the photo so width and height fit within $512 \times 512\text{ px}$.
    - Image is converted to `image/webp`.
    - File size uploaded to UploadThing is reduced by 75%–95% (typically under 40KB).
    - Image visual fidelity remains clear without visible pixelation or distortion.

- [ ] **2.2 Transparent PNG Alpha Channel Preservation**
  - **Steps:** Upload a PNG logo or icon with a transparent background.
  - **Expected:**
    - The background transparency is preserved in the circular avatar preview.
    - Image is encoded as WebP with alpha preservation (no black or white background artifacts).

- [ ] **2.3 EXIF & GPS Metadata Stripping**
  - **Steps:** Upload a smartphone photo that contains GPS location and camera EXIF data.
  - **Expected:**
    - The uploaded image on CDN does not retain GPS coordinates or device serial numbers.
    - The photo preserves its upright visual orientation.

- [ ] **2.4 Oversized File Rejection (>2MB)**
  - **Steps:** Attempt to select an image file larger than 2MB.
  - **Expected:**
    - File picker rejects the upload before transmission.
    - Error banner displays: `"Image size must be less than 2MB."`
    - No network request is dispatched to UploadThing.

- [ ] **2.5 Disguised File / Magic Byte Validation**
  - **Steps:** Create a text file or executable renamed to `fake_photo.png` and attempt to upload.
  - **Expected:**
    - Magic byte inspection catches the invalid header.
    - Error banner displays: `"Invalid image format. Supported formats are JPEG, PNG, and WebP."`
    - File is not uploaded to cloud storage.

- [ ] **2.6 Decompression Bomb Guard**
  - **Steps:** Attempt to upload an image with extreme dimensions (e.g., $8000 \times 8000$ or an extreme aspect ratio strip $>20:1$).
  - **Expected:**
    - Validation error rejects the file before processing canvas memory.
    - User is presented with a clear error message.

---

## 3. Role-Based Avatar Privacy & Anonymity Enforcement

- [ ] **3.1 Student Viewing Tutor Avatar (Allowed)**
  - **Steps:** Log in as a **Student Learner** $\rightarrow$ Navigate to:
    1. **Tutors Browser** (`/learner/tutors`): Check tutor cards.
    2. **Tutor Profile** (`/learner/tutors/[tutorId]`): Check large tutor avatar.
    3. **Classes Browser** (`/learner/classes`): Check tutor avatar on class cards.
    4. **Match Finder** (`/learner/match`): Check tutor avatar on match recommendations.
    5. **Class Details** (`/learner/classes/[classId]`): Click the tutor popover trigger.
  - **Expected:**
    - The tutor's profile picture is clearly visible in all five locations.
    - If the tutor has not uploaded an avatar, their 2-letter monogram is displayed.

- [ ] **3.2 Tutor Viewing Student Avatar (Allowed)**
  - **Steps:** Log in as a **Student Tutor** $\rightarrow$ Navigate to:
    1. **Student Roster** (`/tutor/students`): Check students list table.
    2. **Student Profile** (`/tutor/students/[studentId]`): Check large student avatar.
    3. **Class Details** (`/tutor/classes/[classId]`): Check **Enrolled Learners** table.
    4. **Topic Requests** (`/tutor/requests`): Check open and accepted topic requests.
  - **Expected:**
    - The enrolled/requesting student's profile picture is clearly visible in all four locations.

- [ ] **3.3 Student Viewing Student Avatar (Strictly Prohibited — Privacy Guard)**
  - **Steps:** Log in as **Student Learner A** $\rightarrow$ Inspect class views, classmate interactions, and API responses.
  - **Expected:**
    - Student A **cannot** see Student B's profile picture under any circumstance.
    - No classmate roster is visible to students.
    - Global search (`/api/search`) for learners only returns tutors and classes.
    - `avatarPrivacy.ts` strips `image` to `null` if any learner query targets another learner.

- [ ] **3.4 User Viewing Self (Allowed)**
  - **Steps:** Log in as any role $\rightarrow$ Check profile page, profile edit page, and top header bar.
  - **Expected:**
    - User always sees their own profile picture.

- [ ] **3.5 Admin Viewing All Users (Allowed)**
  - **Steps:** Log in as an **Administrator** $\rightarrow$ Navigate to **User Management** (`/admin/users`) and User Details (`/admin/users/[id]`).
  - **Expected:**
    - Admin can view all profile pictures for both Students and Tutors.

---

## 4. Zoomable Avatar Lightbox Modal & UX

- [ ] **4.1 Click-to-Enlarge Lightbox**
  - **Steps:** Click on any visible profile avatar (tutor card, student roster row, profile page, or admin table).
  - **Expected:**
    - An accessible modal dialog pops up displaying an enlarged, high-resolution view of the profile picture.
    - The modal title displays the user's name or anonymous ID.
    - The modal includes a close button (X) and backdrop click to dismiss.

- [ ] **4.2 Keyboard Accessibility**
  - **Steps:** Focus on an avatar using the `Tab` key $\rightarrow$ Press `Enter` or `Space` $\rightarrow$ Press `Esc`.
  - **Expected:**
    - Pressing `Enter` or `Space` opens the enlarged lightbox modal.
    - Pressing `Esc` closes the modal and returns focus cleanly.

- [ ] **4.3 Event Propagation Stop**
  - **Steps:** Click the avatar of a student inside the **Student Roster** table or a tutor inside the **Class Card**.
  - **Expected:**
    - Clicking the avatar **only** opens the enlarged image modal.
    - It does **not** inadvertently trigger the table row's link or navigate away from the current page.

- [ ] **4.4 Non-Clickable Placeholder Monograms**
  - **Steps:** Hover over an avatar that does not have an uploaded image (initials monogram only).
  - **Expected:**
    - Monogram does not display zoom cursor pointer and cannot be clicked to open an empty modal.

---

## 5. Administrative Moderation & Profile Picture Locking

- [ ] **5.1 Admin Locking Profile Picture**
  - **Steps:** Log in as **Administrator** $\rightarrow$ Navigate to `/admin/users/[id]` of a user with a profile picture $\rightarrow$ Locate the **Profile Picture Moderation** card $\rightarrow$ Click **Lock editing**.
  - **Expected:**
    - Confirmation banner indicates editing has been locked.
    - Status badge reflects `"Locked"`.
    - Database field `profilePictureLocked` is set to `true`.

- [ ] **5.2 User Experience When Locked**
  - **Steps:** Log in as the locked user $\rightarrow$ Navigate to the profile edit page.
  - **Expected:**
    - Yellow warning banner displays: `"Profile picture editing has been locked by an administrator."`
    - The **Upload photo** / **Change photo** and **Remove** buttons are completely disabled.
    - Attempting a direct API call to `/api/user/profile-picture` (DELETE) or `/api/uploadthing` returns HTTP `403 Forbidden`.

- [ ] **5.3 Admin Moderation Removal**
  - **Steps:** In `/admin/users/[id]`, the Admin clicks **Remove picture**.
  - **Expected:**
    - Image is immediately deleted from UploadThing cloud storage.
    - Database fields `image` and `imageKey` are set to `null`.
    - Audit log entry records the administrative moderation action.

- [ ] **5.4 Admin Unlocking Profile Picture**
  - **Steps:** In `/admin/users/[id]`, the Admin clicks **Unlock editing**.
  - **Expected:**
    - User is now permitted to upload a new profile picture.

---

## 6. Frontend Layout Stability & Performance

- [ ] **6.1 Zero Cumulative Layout Shift (CLS)**
  - **Steps:** Load `/learner/tutors` or `/tutor/students` with simulated network throttling (Slow 3G in Chrome DevTools).
  - **Expected:**
    - Avatar containers reserve exact pixel dimensions (`24px`, `32px`, `40px`, `56px`, `80px`, `112px`).
    - The page layout does not jump or shift when images finish loading.

- [ ] **6.2 Asynchronous Decoding**
  - **Steps:** Inspect the `<img>` tag in DevTools.
  - **Expected:**
    - `decoding="async"` attribute is present on all avatar images.
    - `loading="lazy"` is present on roster and browse cards.
    - `loading="eager"` is present on the top header bar avatar.

- [ ] **6.3 Broken Image Fallback (`onError`)**
  - **Steps:** Simulate a broken image URL (e.g., block the `ufs.sh` domain in DevTools Network tab or tamper an image URL).
  - **Expected:**
    - The image does not render a broken browser icon.
    - The component gracefully falls back to displaying the user's two-letter monogram initials.

---

## 7. CLI Scripts: Audit, Benchmark & Migration

- [ ] **7.1 Read-Only Image Audit Script**
  - **Command:** `pnpm exec tsx scripts/audit-and-optimize-images.ts`
  - **Expected:**
    - Inspects the active database without modifying any records.
    - Prints an inventory table showing users with avatars, current file sizes, estimated WebP sizes, and percentage savings.

- [ ] **7.2 Image Compression Benchmark Script**
  - **Command:** `pnpm exec tsx scripts/benchmark-image-compression.ts`
  - **Expected:**
    - Benchmarks synthetic and live images (photographic JPEG, UI screenshot PNG, transparent logo, already-optimized WebP).
    - Outputs a markdown table reporting original dimensions, optimized dimensions, reduction percentage, and execution latency.

- [ ] **7.3 Automated Test Suite Execution**
  - **Command:** `pnpm exec vitest run src/lib/images/ src/lib/__tests__/avatarPrivacy.test.ts`
  - **Expected:**
    - All 24 unit tests in `src/lib/images/` pass.
    - All 11 unit tests in `avatarPrivacy.test.ts` pass.
    - Zero failures or warnings.

- [ ] **7.4 Production Build Verification**
  - **Command:** `pnpm build`
  - **Expected:**
    - Next.js production build completes with `✓ Compiled successfully`.
    - Zero TypeScript compilation errors (`tsc --noEmit`).
