# Super Admin & Admin Account Management — Verification Checklist

**Branch:** `feature/super-admin`  
**Base:** `develop`

---

## 1. Automated Test Suite Verification

Run the following commands to confirm all tests, type-checking, and build validation pass:

- [ ] **Typecheck**: `pnpm exec tsc --noEmit` (0 errors)
- [ ] **Linter**: `pnpm exec eslint src/app/admin/admins/ src/components/admin/AdminManagementTable.tsx src/components/admin/CreateAdminModal.tsx src/lib/permissions.ts src/app/api/admin/admins/` (0 errors)
- [ ] **Unit Tests**: `pnpm exec vitest run` (105 test files, 777 tests passing)
- [ ] **Production Build**: `pnpm build` (All static & dynamic routes compiled successfully)

---

## 2. Seeded Accounts Verification

After running `pnpm exec tsx prisma/seed.ts` (or viewing `/dev/login`):

- [ ] `superadmin@katuwang.test` (`password123`) is provisioned with role `SUPER_ADMIN` and ID `ADM-0002`.
- [ ] `admin@katuwang.test` (`password123`) is provisioned with role `ADMIN` and ID `ADM-0001`.
- [ ] Both appear on the `/dev/login` quick sign-in board.

---

## 3. Route Guard & Navigation Access Tests

### 3.1 Unauthenticated Visitors
- [ ] Navigate directly to `/admin/admins` while logged out:
  - Expect redirect to `/login` or `/unauthorized`.
- [ ] Send `GET /api/admin/admins`:
  - Expect HTTP `401 Unauthorized`.

### 3.2 Student Learners & Student Tutors
- [ ] Sign in as a Learner (e.g., `demo@learner.test`):
  - Sidebar shows Learner Portal navigation. No admin routes accessible.
  - Navigate directly to `/admin/admins`: Expect redirect to `/unauthorized`.
  - Send `GET /api/admin/admins`: Expect HTTP `403 Forbidden`.
- [ ] Sign in as a Tutor (e.g., `demo@tutor.test`):
  - Sidebar shows Tutor Portal navigation.
  - Navigate directly to `/admin/admins`: Expect redirect to `/unauthorized`.
  - Send `GET /api/admin/admins`: Expect HTTP `403 Forbidden`.

### 3.3 Standard Admin (`admin@katuwang.test`)
- [ ] Sign in as standard Admin:
  - Sidebar displays standard Admin items (Users, Registrations, Classes, Question Bank, Settings, Reports, etc.).
  - "Admins" navigation item is **NOT** visible in sidebar.
  - Navigate directly to `/admin/admins`: Expect redirect to `/unauthorized` or 404.
  - Send `GET /api/admin/admins`: Expect HTTP `403 Forbidden`.
  - Send `POST /api/admin/admins`: Expect HTTP `403 Forbidden`.
  - Verify standard admin operations still work (viewing `/admin/users`, approving registrations, etc.).

### 3.4 Super Admin (`superadmin@katuwang.test`)
- [ ] Sign in as Super Admin:
  - Sidebar displays all standard Admin items **plus** the `"Admins"` navigation link with icon.
  - Navigate to `/admin/admins`: Expect page to load with header "Platform Administrators".
  - Full access to all existing admin modules (`/admin/users`, `/admin/classes`, `/admin/settings`, `/admin/reports`).

---

## 4. Admin Management Feature Tests (as Super Admin)

### 4.1 Admin Accounts Table
- [ ] View list of administrators at `/admin/admins`:
  - Super Admin (`superadmin@katuwang.test`) has a clean light-green pill badge with crown icon and forest green text.
  - Standard Admin (`admin@katuwang.test`) has a clean light-slate pill badge with shield icon.
  - Actions column for Super Admin displays `System Protected`.
  - Summary metric cards correctly display total admins, super admins, and standard admins with uniform height, green icon badges, and high-contrast count numbers.
- [ ] Test Search filter (by name, email, anonymous ID).
- [ ] Test Role filter (All Roles, Super Admins, Standard Admins).
- [ ] Test Status filter (All Statuses, Active, Suspended).

### 4.2 Provisioning a New Admin Account
- [ ] Click **"Create Admin Account"** button:
  - The provision modal appears.
- [ ] Submit invalid input (empty fields or invalid email format):
  - Form displays clear error banner.
- [ ] Enter duplicate email (e.g., `admin@katuwang.test`):
  - Expect 409 conflict error message: "An account with this email address already exists."
- [ ] Enter valid details:
  - First Name: `Test`
  - Last Name: `Administrator`
  - Email: `test.admin@school.edu`
  - Contact Info: `0917-000-1111`
- [ ] Submit form:
  - Success banner appears: "Admin Provisioned".
  - Role is confirmed as `ADMIN` (cannot be escalated to `SUPER_ADMIN`).
  - Next sequential anonymous ID is generated (e.g., `ADM-0003`).
  - An activation link is displayed (e.g., `/reset-password?token=...`).
  - Click "Copy" button: Button changes to "Copied" and link is copied to clipboard.
  - Close modal: Table automatically refreshes and displays the new admin.

### 4.3 Admin Account Activation
- [ ] In an incognito tab, open the generated activation link (`/reset-password?token=...`).
- [ ] Enter a new password for the new admin account.
- [ ] Sign in using `test.admin@school.edu` and the new password:
  - Successfully authenticates and lands in Admin Portal.
  - Does **not** have access to `/admin/admins` or "Admins" nav item (standard admin).

### 4.4 Moderation (Suspend & Reactivate Standard Admin)
- [ ] As Super Admin on `/admin/admins`:
  - Locate `test.admin@school.edu` (or `admin@katuwang.test`).
  - Click **"Suspend"** button:
    - Confirmation modal opens.
    - Enter reason: "Temporary suspension for review".
    - Click "Confirm Suspension".
    - Table updates status badge to `SUSPENDED` (warning tone).
- [ ] Attempt to sign in as the suspended admin:
  - Access is immediately blocked with message indicating account is suspended.
- [ ] As Super Admin on `/admin/admins`:
  - Click **"Reactivate"** on the suspended admin.
  - Confirm reactivation.
  - Table updates status badge back to `ACTIVE`.
- [ ] Sign in as the reactivated admin:
  - Dashboard access is restored.

### 4.5 Self-Protection & Super Admin Invariance
- [ ] As Super Admin, attempt to suspend `superadmin@katuwang.test`:
  - UI shows `System Protected` without a suspend button.
  - If a direct `PATCH /api/admin/admins/[superAdminId]` is sent:
    - Expect HTTP `400 Bad Request` ("You cannot suspend or modify your own account status.") or `403` ("Cannot modify a Super Admin account.").

---

## 5. Audit Logging Verification
- [ ] Navigate to `/admin/audit-log` as Super Admin:
  - Confirm `ADMIN_CREATED` action is logged with target ID of the provisioned admin.
  - Confirm `ADMIN_STATUS_CHANGE` action is logged whenever an admin is suspended or reactivated.

---

## 6. CLI Promotion Tool Verification
- [ ] Run `pnpm exec tsx scripts/promote-super-admin.ts`:
  - Displays usage information.
- [ ] Run `pnpm exec tsx scripts/promote-super-admin.ts nonexistent@katuwang.test`:
  - Displays error: "No user found with email...".
- [ ] Run `pnpm exec tsx scripts/promote-super-admin.ts superadmin@katuwang.test`:
  - Displays notice: "User ... is already a SUPER_ADMIN."
- [ ] Run `pnpm exec tsx scripts/promote-super-admin.ts test.admin@school.edu`:
  - Promotes the standard admin to `SUPER_ADMIN`.
  - Next sign-in for that user unlocks the Super Admin features.
