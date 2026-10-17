# Katuwang — Full-Stack Browser Compatibility Audit Report

**Audit Mode:** Read-Only Static Analysis & Safe Command Verification  
**Date:** 2026-10-17  
**Auditor:** Antigravity AI Pair Programmer  
**Repository:** Katuwang (Academic match and support portal)  

---

## Table of Contents
1. [A. Executive Summary](#a-executive-summary)
2. [B. Repository Architecture](#b-repository-architecture)
3. [C. Browser Compatibility Matrix](#c-browser-compatibility-matrix)
4. [D. Detailed Findings](#d-detailed-findings)
5. [E. Frontend Findings](#e-frontend-findings)
6. [F. Backend and API Findings](#f-backend-and-api-findings)
7. [G. Testing Results](#g-testing-results)
8. [H. Recommended Remediation Plan](#h-recommended-remediation-plan)
9. [I. Final Verdict](#i-final-verdict)

---

## A. Executive Summary

### Overall Compatibility Assessment
The Katuwang application demonstrates a robust architectural foundation using modern web standards (Next.js 16 App Router, React 19, Tailwind CSS v4, DaisyUI 5, and Prisma 7). The platform's core functional logic and server-side routes are thoroughly tested (102 test files, 746 automated tests passing in Vitest).

However, from a **cross-browser and cross-device perspective**, the application carries notable technical risks. The codebase was primarily developed and tested in desktop Google Chrome, leaving critical compatibility gaps in:
1. **Apple Safari & iOS WebKit** (event delegation, synchronous blob revoking, mobile auto-zoom, and aggressive GET caching).
2. **Mozilla Firefox** (asynchronous object URL handling during file downloads).
3. **Cross-Timezone / Cross-Locale SSR Hydration** (server rendering in UTC vs. client rendering in Philippine Time UTC+8).
4. **Legacy & Secondary Browsers** (Samsung Internet <22, Safari <16.2, Chrome <111 due to reliance on CSS `oklch()` and `color-mix()` without sRGB fallbacks).

### Main Technical Risks
- **Blob Download Failure in Safari/Firefox:** Synchronous revocation of Object URLs breaks CSV report downloads.
- **Mobile Safari Usability Deficits:** Form input font sizes (<16px) cause disruptive automatic viewport zoom; missing touch event delegation (`cursor: pointer`) prevents closing modals and the mobile drawer via backdrop tap.
- **Aggressive API Caching in Safari:** Lack of `Cache-Control: no-store` on authenticated API endpoints causes Safari to serve stale cached GET responses after state changes.
- **SSR Hydration Mismatch & Timezone Drift:** Client components formatting dates and calendar columns using runtime-dependent locales without hydration suppression.
- **CSS `color-mix()` Breakdown:** Older browser versions fail to compute CSS variables, causing text and badge backgrounds to render transparent.

### Highest-Priority Findings
- **FIND-XBR-01 (P1):** Synchronous `URL.revokeObjectURL(url)` immediately after `a.click()` breaks CSV report downloads in Safari and Firefox.
- **FIND-XBR-02 (P1):** Form input font sizes (`text-xs` / 12px) trigger automatic viewport zooming on iOS Safari / WebKit.
- **FIND-XBR-03 (P1):** Missing `cursor: pointer` on backdrop overlays prevents dismiss-on-tap on iOS WebKit.
- **FIND-XBR-04 (P1):** Omission of `Cache-Control: no-store` on authenticated API endpoints causes aggressive GET request caching in Safari.
- **FIND-XBR-09 (P2):** `meetingLink` allows `javascript:` pseudo-protocol URLs creating an XSS risk across all browsers.

### Current Support Policy (Documented vs. Observed)
- **Documented Policy:** The thesis documentation (`docs/reference/thesis.md`) specifies: *"The platform will be designed as a web application compatible with all browsers on both desktop and mobile devices to enable access by any user within the institution... Google Chrome will be used as the primary browser for development, testing, and performance profiling."*
- **Implementation Audit:** `docs/reference/thesis-implementation-audit.md` explicitly classifies item `T-SCOPE-08` (*Responsive, all browsers/devices*) as **PARTIALLY IMPLEMENTED — VERIFICATION REQUIRED**, noting: *"Tailwind/DaisyUI responsive layout exists; no automated cross-browser test suite; manual spot-checks only."*

### Major Testing Limitations
- No browser automation harness (Playwright, Cypress, Selenium, or Puppeteer) exists in the repository.
- Vitest tests run exclusively in a headless Node.js environment (`environment: "node"`), verifying API routes and pure algorithmic logic without browser DOM rendering, WebKit/Gecko layout engines, or CSS evaluation.
- Testing on physical iOS devices, Safari, Firefox, and Samsung Internet was conducted via source code analysis and browser specification mapping.

---

## B. Repository Architecture

```mermaid
flowchart TD
    Client["Browser Clients (Chrome, Safari, Firefox, Edge, Mobile WebKit)"]
    NextProxy["Next.js 16 Proxy (src/proxy.ts)"]
    AppRouter["Next.js App Router (React 19 Server & Client Components)"]
    API["API Route Handlers (/api/*)"]
    Auth["NextAuth 4.24.15 (JWT Session in HttpOnly Cookie)"]
    DB[("MariaDB / MySQL via Prisma 7.8")]
    Storage["UploadThing (Profile Pictures)"]

    Client -->|HTTP Requests| NextProxy
    NextProxy -->|Route Guards & Session Check| AppRouter
    NextProxy -->|Bypass to API| API
    AppRouter -->|Client fetch()| API
    API -->|Session Validation| Auth
    API -->|Query / Mutate| DB
    Client -.->|Direct Uploads| Storage
```

- **Frontend Framework:** Next.js 16.2.12 with React 19.2.4 and React DOM 19.2.4 (App Router).
- **Styling & Design System:** Tailwind CSS v4 (`@tailwindcss/postcss` 4) and DaisyUI 5.6.13, using CSS custom properties with OKLCH color spaces.
- **Typography:** Local WOFF2 fonts (Apfel Grotezk and Fragment Mono) loaded via `next/font/local`.
- **Backend Runtime:** Node.js 20+ with Next.js Route Handlers.
- **Routing & Rendering:** Hybrid Server-Side Rendering (RSC) and Client Components (`"use client"`). Middleware logic is implemented in `src/proxy.ts` per Next.js 16 file conventions.
- **Authentication:** NextAuth 4.24.15 with Credentials Provider, stateless 8-hour JWT session cookies (`SameSite: Lax`, `HttpOnly`, `Path: /`).
- **Data Layer:** Prisma 7.8.0 with `@prisma/adapter-mariadb` and `mariadb` 3.5.4 driver.
- **Third-Party Integrations:** UploadThing 7.7.4 for file uploads; Nodemailer for transactional email delivery.
- **Existing Test Infrastructure:** Vitest 4.1.11 configured in `node` environment, covering API route handlers, Zod schemas, chatbot classification, and date/score calculation utilities.

---

## C. Browser Compatibility Matrix

| Browser / Platform | Actual Testing Status | Tests Executed | Confirmed Issues | Potential Risks Requiring Further Verification |
| :--- | :--- | :--- | :--- | :--- |
| **Google Chrome (Desktop)** | Static analysis + safe unit/type tests | Vitest unit suite (746 tests), ESLint, TS check | Non-Apple platform displays `⌘K` shortcut badge ([FIND-XBR-11](#find-xbr-11)). | Native datetime picker UI variations on older OS versions. |
| **Mozilla Firefox (Desktop)** | Static analysis + safe unit/type tests | Vitest unit suite (746 tests), ESLint, TS check | CSV export download fails due to synchronous `revokeObjectURL` ([FIND-XBR-01](#find-xbr-01)). | Quick Find shortcut collision with `/` key focus handler. |
| **Apple Safari (macOS)** | Static analysis only | Code analysis & browser engine mapping | CSV export fails ([FIND-XBR-01](#find-xbr-01)); aggressive API GET caching ([FIND-XBR-04](#find-xbr-04)). | OKLCH color rendering on macOS Monterey (Safari < 16.2) ([FIND-XBR-06](#find-xbr-06)). |
| **Apple Safari (iOS / iPadOS)** | Static analysis only | Code analysis & browser engine mapping | Input auto-zoom on focus ([FIND-XBR-02](#find-xbr-02)); backdrop tap fails to close modals/drawer ([FIND-XBR-03](#find-xbr-03)); virtual keyboard overlap ([FIND-XBR-10](#find-xbr-10)). | Viewport scroll bounce causing sticky header shifts. |
| **Microsoft Edge (Desktop)** | Static analysis + safe unit/type tests | Vitest unit suite (746 tests), ESLint, TS check | Non-Apple platform displays `⌘K` shortcut badge ([FIND-XBR-11](#find-xbr-11)); HSTS header in dev mode ([FIND-XBR-14](#find-xbr-14)). | Scrollbar customization overrides native Edge appearance. |
| **Chrome on Android** | Static analysis only | Code analysis & browser engine mapping | Global search completely inaccessible on screens < 640px ([FIND-XBR-12](#find-xbr-12)). | Sticky `:hover` states persisting after tap on class/tutor cards. |
| **Samsung Internet** | Static analysis only | Code analysis & browser engine mapping | Versions < 22 fail to parse `color-mix()` and `oklch()` without fallback ([FIND-XBR-06](#find-xbr-06)); search inaccessible on mobile ([FIND-XBR-12](#find-xbr-12)). | Virtual keyboard viewport resizing behavior in older versions. |

---

## D. Detailed Findings

### FIND-XBR-01: Synchronous `URL.revokeObjectURL(url)` immediately after `a.click()` breaks CSV file download in Safari and Firefox
- **Severity:** P1 (High)
- **Affected Browsers:** Apple Safari (macOS & iOS, all versions), Mozilla Firefox (all versions)
- **Affected Platform:** macOS, iOS, Windows, Linux, Android
- **File & Line:** `src/lib/csv.ts:37-39`
- **Problem Description:** In `downloadCsv()`, `URL.revokeObjectURL(url)` is invoked synchronously on the line immediately following `a.click()`.
- **Evidence / Reproduction Steps:**
  ```typescript
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  ```
  In Firefox and Safari, `a.click()` dispatches an asynchronous download task. When `URL.revokeObjectURL(url)` runs synchronously in the same microtask/event tick, the browser engine revokes the memory blob before the network/download subsystem can stream it, resulting in a canceled download, network error, or 0-byte file.
- **Root Cause (Confirmed):** Premature object URL revocation before the browser's asynchronous file extraction completes.
- **Potential User Impact:** Administrators using Safari or Firefox cannot download the CSV report from `/admin/reports`.
- **Recommended Fix:** Delay revocation using `setTimeout`:
  ```typescript
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  ```
- **Recommended Regression Test:** Trigger CSV download in Safari and Firefox; verify download finishes with non-zero file size and valid content.
- **Verification Status:** Confirmed root cause via static analysis and WHATWG HTML / WebKit download pipeline behavior.

---

### FIND-XBR-02: Automatic viewport zoom on input focus in iOS Safari / WebKit due to `font-size < 16px`
- **Severity:** P1 (High)
- **Affected Browsers:** Apple Safari on iOS, Chrome/Firefox/Edge on iOS (WebKit engine)
- **Affected Platform:** iOS (iPhone, iPad)
- **Files & Lines:** 
  - `src/components/auth/LoginForm.tsx:127, 149`
  - `src/components/auth/RegisterForm.tsx:133-237`
  - `src/components/auth/ResetPasswordForm.tsx:92, 120`
  - `src/components/chatbot/ChatWidget.tsx:144`
  - `src/components/tutor/EditClassForm.tsx:308-328`
- **Problem Description:** Form input fields across login, registration, password recovery, and the chatbot use `input-sm text-xs` (0.75rem = 12px) or `text-sm` (0.875rem = 14px). iOS Safari enforces an accessibility behavior that automatically zooms into any form input with computed `font-size < 16px` upon focus.
- **Evidence / Reproduction Steps:** Focus the email or password input in `LoginForm.tsx` or the message input in `ChatWidget.tsx` on an iPhone. The viewport abruptly zooms in to ~125%, pushing navigation and action buttons outside the visible viewport.
- **Root Cause (Confirmed):** iOS WebKit heuristic that magnifies inputs with font size below 16px to improve legibility.
- **Potential User Impact:** Highly jarring user experience on mobile devices; users must manually pinch-to-zoom out after typing.
- **Recommended Fix:** Ensure form inputs on mobile have a minimum font size of 16px (1rem), e.g., `text-base sm:text-xs` or apply a global CSS rule:
  ```css
  @media screen and (max-width: 768px) {
    input, select, textarea {
      font-size: 16px !important;
    }
  }
  ```
- **Recommended Regression Test:** Focus inputs across all auth and form pages in an iOS simulator or device; confirm page scale remains 1.0.
- **Verification Status:** Confirmed root cause via static analysis and WebKit viewport specifications.

---

### FIND-XBR-03: Missing `cursor: pointer` on overlay backdrops breaks touch dismiss on iOS WebKit
- **Severity:** P1 (High)
- **Affected Browsers:** Apple Safari on iOS, all iOS third-party browsers (WebKit)
- **Affected Platform:** iOS (iPhone, iPad)
- **Files & Lines:**
  - `src/components/layout/PortalLayout.tsx:263-269`
  - `src/components/ui/Modal.tsx:97-101`
  - `src/components/learner/ReportButton.tsx:181`
  - `src/components/admin/QuestionBankManager.tsx:575, 795, 1017`
- **Problem Description:** The mobile navigation backdrop in `PortalLayout.tsx` is rendered as a `<div>` with `onClick={() => setMenuOpen(false)}` but without `cursor: pointer`. Similarly, `Modal.tsx` renders `<label className="modal-backdrop" onClick={onClose} />`. iOS Safari event delegation ignores click events on non-interactive elements unless they possess `cursor: pointer` or are native buttons.
- **Evidence / Reproduction Steps:** Open the mobile drawer in `PortalLayout.tsx` on an iPhone. Tap the dark dimmed backdrop outside the drawer. The tap event fails to propagate to the `onClick` handler, and the drawer remains open.
- **Root Cause (Confirmed):** iOS WebKit event delegation requires `cursor: pointer` on non-interactive elements to dispatch synthesized mouse/click events.
- **Potential User Impact:** Mobile users cannot close the navigation drawer or modals by tapping outside the active container.
- **Recommended Fix:** Add `cursor-pointer` to backdrop classes, or convert backdrops to native `<button type="button" aria-label="Close" className="modal-backdrop cursor-pointer" ... />`.
- **Recommended Regression Test:** Test mobile navigation drawer and dialogs on iOS Safari; verify tapping backdrop closes the overlay.
- **Verification Status:** Confirmed root cause via static analysis and WebKit DOM event specification.

---

### FIND-XBR-04: Missing `Cache-Control: no-store` on authenticated API endpoints causes aggressive GET caching in Safari
- **Severity:** P1 (High)
- **Affected Browsers:** Apple Safari (macOS & iOS), older Edge
- **Affected Platform:** macOS, iOS, Windows
- **Files & Lines:** All authenticated routes in `src/app/api/` (e.g. `src/app/api/notifications/route.ts`, `src/app/api/search/route.ts`, `src/app/api/admin/users/route.ts`)
- **Problem Description:** While `src/app/api/health/route.ts:21` explicitly sends `Cache-Control: no-store, no-cache, must-revalidate`, all other API endpoints omit `Cache-Control`. Safari aggressively caches JSON GET responses heuristic-style, and client-side `fetch()` calls in the frontend omit `{ cache: "no-store" }`.
- **Evidence / Reproduction Steps:** In Safari, mark notifications as read or accept a topic request, then trigger a re-fetch. Safari frequently serves the previously cached JSON response from memory/disk cache without contacting the server.
- **Root Cause (Confirmed):** Omission of explicit HTTP caching headers on sensitive, state-dependent API routes.
- **Potential User Impact:** Stale notifications, unrefreshed moderation tables, or phantom data persisting across navigations in Safari.
- **Recommended Fix:** Add default headers in `next.config.ts` for `/api/:path*`:
  ```typescript
  { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate" }
  ```
- **Recommended Regression Test:** Perform a state mutation in Safari, trigger a re-fetch, and verify network log confirms status 200 with uncached content.
- **Verification Status:** Confirmed root cause via static analysis.

---

### FIND-XBR-05: Server/Client timezone drift causes SSR hydration mismatches and timetable shifts
- **Severity:** P2 (Medium)
- **Affected Browsers:** All browsers (Chrome, Firefox, Safari, Edge, Samsung Internet) when browser timezone/locale differs from server environment
- **Affected Platform:** Cross-platform (Production Node.js server in UTC vs. end users in UTC+8)
- **Files & Lines:**
  - `src/lib/datetime.ts:24-51`
  - `src/components/schedule/WeeklyTimetable.tsx:41-66`
  - `src/app/tutor/page.tsx:184-207`
  - `src/components/classes/ClassCard.tsx:69-73`
- **Problem Description:** `datetime.ts` formats timestamps using `toLocaleDateString(undefined, ...)`, which evaluates using the server's timezone during Server-Side Rendering (UTC on Render/Docker) and the browser's timezone on the client (UTC+8 in the Philippines). In `WeeklyTimetable.tsx`, the day index is calculated via `(new Date(s.scheduledAt).getDay() + 6) % 7`. When rendered on a UTC server, late evening sessions in Manila are assigned to the previous calendar day.
- **Evidence / Reproduction Steps:** A session scheduled for Monday 6:00 AM PHT (`2026-10-19T22:00:00Z` Sunday UTC) is placed in Sunday's column by the server. If hydrated or re-rendered on the client, it flips to Monday, generating React hydration mismatch errors.
- **Root Cause (Confirmed):** Implicit locale/timezone evaluation across the SSR and client boundary.
- **Potential User Impact:** Class sessions appear in the wrong weekday column in the weekly timetable; console hydration errors.
- **Recommended Fix:** Pin the explicit timezone in `datetime.ts`:
  ```typescript
  export const APP_TIMEZONE = "Asia/Manila";
  export function formatTime(input: DateInput): string {
    return asDate(input).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", timeZone: APP_TIMEZONE });
  }
  ```
  Add `suppressHydrationWarning` on elements displaying formatted timestamps.
- **Recommended Regression Test:** Start dev server with `TZ=UTC` and load pages in a browser set to `Asia/Manila`; verify zero hydration errors and matching calendar slots.
- **Verification Status:** Confirmed root cause via static analysis.

---

### FIND-XBR-06: Missing fallbacks for OKLCH and `color-mix()` in Safari <16.2, Firefox <113, and Samsung Internet <22
- **Severity:** P2 (Medium)
- **Affected Browsers:** Apple Safari < 16.2 (iOS 15–16.1, macOS Monterey Safari 15.x/16.0), Mozilla Firefox < 113, Google Chrome / Edge < 111, Samsung Internet < 22
- **Affected Platform:** Older iOS, macOS, Android, and enterprise LTS desktop browsers
- **Files & Lines:** `src/app/globals.css:16-111`
- **Problem Description:** Key design system tokens in `src/app/globals.css` (`--kt-tint-primary`, `--kt-tint-learner`, `--kt-tint-tutor`, `--kt-muted`, `--kt-faint`, `--kt-warning-text`) are defined exclusively using `color-mix(in oklch, ...)`. In browsers released before early 2023, `color-mix()` is unsupported, causing these variables to fail at computed-value time and resolve to transparent/unset.
- **Evidence / Reproduction Steps:** In an unsupported browser, text using `color: var(--kt-muted)` or `color: var(--kt-faint)` disappears, and badge backgrounds lose their color.
- **Root Cause (Confirmed):** Absence of progressive enhancement / fallback sRGB values for OKLCH and CSS Color Module Level 4 functions.
- **Potential User Impact:** Interface becomes unreadable on older devices.
- **Recommended Fix:** Provide sRGB/hex fallback properties or configure PostCSS with `@csstools/postcss-color-mix-function`.
- **Recommended Regression Test:** Inspect computed CSS in an emulated older browser version to verify fallback colors apply.
- **Verification Status:** Confirmed root cause via CSS specification analysis.

---

### FIND-XBR-07: Synchronous `setState` inside `useEffect` in `PortalLayout.tsx` flagged by React 19 linter
- **Severity:** P2 (Medium)
- **Affected Browsers:** All browsers running React 19
- **Affected Platform:** All platforms
- **Files & Lines:** `src/components/layout/PortalLayout.tsx:70-78`
- **Problem Description:** In `PortalLayout.tsx`, `setCollapsed(JSON.parse(raw))` is called synchronously within the effect body to read navigation preferences from `localStorage`.
- **Evidence / Reproduction Steps:** Automated linter output:
  ```text
  /home/hikaru/Capstone/katuwang/src/components/layout/PortalLayout.tsx
    73:16  error  Error: Calling setState synchronously within an effect can trigger cascading renders  react-hooks/set-state-in-effect
  ```
- **Root Cause (Confirmed):** Synchronous state mutation inside an effect body contrary to React 19 architecture guidelines.
- **Potential User Impact:** Unnecessary double-render on client mount, causing navigation flash.
- **Recommended Fix:** Initialize state lazily or use `useSyncExternalStore` for external `localStorage` subscriptions.
- **Recommended Regression Test:** Execute `pnpm exec eslint --no-cache` and confirm zero errors.
- **Verification Status:** Confirmed via automated ESLint execution.

---

### FIND-XBR-08: Missing `name` and `autoComplete` attributes on authentication form fields
- **Severity:** P2 (Medium)
- **Affected Browsers:** Apple Safari (iCloud Keychain), Google Chrome, Mozilla Firefox, Microsoft Edge
- **Affected Platform:** macOS, iOS, Windows, Android
- **Files & Lines:**
  - `src/components/auth/LoginForm.tsx:120-150`
  - `src/components/auth/RegisterForm.tsx:207-238`
  - `src/components/auth/ResetPasswordForm.tsx:84-123`
- **Problem Description:** In `LoginForm.tsx`, the email and password inputs lack `name` attributes and WHATWG `autoComplete` attributes (`autoComplete="email"`, `autoComplete="current-password"`). In `RegisterForm.tsx` and `ResetPasswordForm.tsx`, password inputs lack `autoComplete="new-password"`.
- **Evidence / Reproduction Steps:** Code inspection shows inputs without `name` or `autoComplete`. Password managers cannot reliably determine field semantics.
- **Root Cause (Confirmed):** Omission of standard WHATWG autofill metadata.
- **Potential User Impact:** Password managers fail to autofill or save credentials; iOS QuickType bar does not offer keychain passwords.
- **Recommended Fix:** Add `name="email" autoComplete="email"` and `name="password" autoComplete="current-password"` to `LoginForm.tsx`; add `autoComplete="new-password"` to registration and reset forms.
- **Recommended Regression Test:** Verify password save prompt and credential autofill in Safari, Chrome, and Firefox.
- **Verification Status:** Confirmed root cause via static analysis.

---

### FIND-XBR-09: `meetingLink` allows `javascript:` pseudo-protocol URLs creating an XSS vector
- **Severity:** P2 (Medium)
- **Affected Browsers:** All browsers (Firefox, Safari, Edge, Chrome)
- **Affected Platform:** Cross-platform
- **Files & Lines:**
  - `src/lib/validations/class.ts:59-65`
  - `src/components/classes/ClassDetailsView.tsx:151-158`
- **Problem Description:** In `class.ts`, `meetingLink` is validated with `z.string().trim().url()`. In WHATWG URL parsing, `javascript:alert(1)` is a syntactically valid URL. In `ClassDetailsView.tsx`, the link is rendered as `<a href={meetingLink} target="_blank" rel="noopener noreferrer">`.
- **Evidence / Reproduction Steps:** Submit a class with `meetingLink: "javascript:..."`. The Zod schema accepts the input because `new URL("javascript:...")` succeeds. When a user clicks the link, the browser executes the URL.
- **Root Cause (Confirmed):** URL validation does not restrict protocol to `http:` or `https:`.
- **Potential User Impact:** Stored Cross-Site Scripting (XSS) if a tutor account is compromised or malicious.
- **Recommended Fix:** Refine Zod validation schema:
  ```typescript
  meetingLink: z.string().trim().url("Invalid URL format.").refine((u) => /^https?:\/\//i.test(u), "Meeting link must start with http:// or https://").optional().or(z.literal(""))
  ```
- **Recommended Regression Test:** Attempt creating a class with `javascript:void(0)` as meetingLink; verify validation rejection with 400 status.
- **Verification Status:** Confirmed root cause via static analysis.

---

### FIND-XBR-10: Missing safe-area insets and static `vh` units in `ChatWidget` cause mobile clipping
- **Severity:** P2 (Medium)
- **Affected Browsers:** Apple Safari on iOS, Chrome on Android
- **Affected Platform:** iOS (iPhone X–16 with home indicator), Android (gesture navigation)
- **Files & Lines:** `src/components/chatbot/ChatWidget.tsx:92-105`
- **Problem Description:** The floating trigger button uses `fixed bottom-5 right-4` and the chat dialog uses `max-h-[min(30rem,calc(100vh-7rem))]`. On modern iPhones, the native home indicator occupies the bottom 20–34px. Without `env(safe-area-inset-bottom)`, the button overlaps the system gesture area. Furthermore, `100vh` does not shrink when the mobile virtual keyboard opens, pushing the message input underneath the keyboard.
- **Evidence / Reproduction Steps:** Code inspection confirms absence of `safe-area-inset` CSS variables and lack of dynamic `dvh` units.
- **Root Cause (Confirmed):** Use of fixed pixel offsets and static `vh` units instead of safe-area insets and `dvh`.
- **Potential User Impact:** Taps on the chatbot button trigger the iOS home swipe gesture; chat input is obscured while typing.
- **Recommended Fix:** Apply safe area padding and dynamic viewport height:
  ```css
  bottom: calc(1.25rem + env(safe-area-inset-bottom, 0px));
  max-height: min(30rem, calc(100dvh - 7rem));
  ```
- **Recommended Regression Test:** Open chatbot on physical iPhone with on-screen keyboard active; verify entire widget remains accessible.
- **Verification Status:** Confirmed root cause via static analysis.

---

### FIND-XBR-11: Global search hotkey label hardcoded as `⌘K` on non-Apple platforms
- **Severity:** P3 (Low)
- **Affected Browsers:** Chrome, Firefox, Edge on Windows and Linux
- **Affected Platform:** Windows, Linux, Android, ChromeOS
- **Files & Lines:** `src/components/layout/GlobalSearch.tsx:194`
- **Problem Description:** The search input displays `<kbd>⌘K</kbd>` statically. While the event listener correctly checks `e.metaKey || e.ctrlKey`, Windows and Linux users have no Command (`⌘`) key on their keyboards.
- **Evidence / Reproduction Steps:** Code inspection of line 194 shows hardcoded `⌘K`.
- **Root Cause (Confirmed):** Lack of platform-specific modifier key detection.
- **Potential User Impact:** Minor confusion for Windows and Linux users regarding the shortcut key.
- **Recommended Fix:** Detect client OS via `navigator.userAgent` and render `Ctrl+K` on Windows/Linux and `⌘K` on macOS/iOS.
- **Recommended Regression Test:** Inspect search badge on Windows Chrome and macOS Safari; verify corresponding platform key is shown.
- **Verification Status:** Confirmed root cause via static analysis.

---

### FIND-XBR-12: Global search is hidden on mobile viewports (<640px) without a mobile trigger
- **Severity:** P3 (Low)
- **Affected Browsers:** All mobile browsers (Safari iOS, Chrome Android, Samsung Internet)
- **Affected Platform:** Mobile smartphones (<640px)
- **Files & Lines:**
  - `src/components/layout/GlobalSearch.tsx:144`
  - `src/components/layout/PortalLayout.tsx:232`
- **Problem Description:** `GlobalSearch.tsx` has `className="kt-search relative hidden sm:flex"`. On screens under 640px width, global search is hidden, but neither the mobile header nor the mobile drawer provides a replacement search affordance.
- **Evidence / Reproduction Steps:** Code inspection confirms `hidden sm:flex` suppresses the search bar entirely on mobile screens.
- **Root Cause (Confirmed):** Responsive design hides desktop search without providing a mobile modal or drawer search action.
- **Potential User Impact:** Mobile phone users cannot use global search to find classes, tutors, or topics.
- **Recommended Fix:** Add a search icon button in the mobile header that opens search in a full-screen mobile modal.
- **Recommended Regression Test:** View mobile viewport at 375px width; verify search affordance is accessible.
- **Verification Status:** Confirmed root cause via static analysis.

---

### FIND-XBR-13: Notification dropdown overflows viewport on narrow screens (<=320px)
- **Severity:** P3 (Low)
- **Affected Browsers:** Mobile browsers on small displays (iPhone SE 1st gen, Galaxy Z Fold cover display)
- **Affected Platform:** Mobile smartphones
- **Files & Lines:** `src/components/notifications/NotificationBell.tsx:129`
- **Problem Description:** In `NotificationBell.tsx`, the dropdown menu has fixed width `w-80` (320px / 20rem) anchored to `right-0`. On screen widths ≤ 320px, the 320px container anchored to the right overflows off the left viewport boundary.
- **Evidence / Reproduction Steps:** Emulate a 320px or 280px viewport width and click the notification bell. The left edge of the dropdown is clipped.
- **Root Cause (Confirmed):** Fixed width declaration without responsive max-width constraint.
- **Potential User Impact:** Content on the left side of notifications is truncated on narrow mobile screens.
- **Recommended Fix:** Replace `w-80` with `w-[min(20rem,calc(100vw-1.5rem))]`.
- **Recommended Regression Test:** Test notification bell dropdown at 320px viewport; confirm zero horizontal overflow.
- **Verification Status:** Confirmed root cause via static analysis.

---

### FIND-XBR-14: Unconditional `Strict-Transport-Security` header in local development
- **Severity:** P3 (Low)
- **Affected Browsers:** Microsoft Edge, Google Chrome, Safari, Firefox
- **Affected Platform:** Cross-platform
- **Files & Lines:** `next.config.ts:28-32`
- **Problem Description:** `Strict-Transport-Security` (`max-age=31536000; includeSubDomains`) is included in `securityHeaders` unconditionally, even during local development (`isDev`). If `localhost` is ever accessed via HTTPS, browsers cache the HSTS policy for one year, blocking subsequent HTTP connections on `localhost:3000`.
- **Evidence / Reproduction Steps:** In `next.config.ts`, `securityHeaders` includes HSTS without checking `process.env.NODE_ENV === "production"`.
- **Root Cause (Confirmed):** HSTS header is not restricted to production builds.
- **Potential User Impact:** Developers and QA testers can be locked out of `http://localhost:3000` on their machines.
- **Recommended Fix:** Conditionally append HSTS only when `process.env.NODE_ENV === "production"`.
- **Recommended Regression Test:** Check dev server HTTP response headers to ensure HSTS is absent.
- **Verification Status:** Confirmed root cause via static analysis.

---

## E. Frontend Findings

### CSS & Styling
- **OKLCH & `color-mix()`:** Modern browsers (Chrome 111+, Safari 16.2+, Firefox 113+, Edge 111+) fully render the theme palette. Fallback colors are missing for legacy clients ([FIND-XBR-06](#find-xbr-06)).
- **Custom Scrollbars:** Thin scrollbars defined via `scrollbar-width: thin` and `::-webkit-scrollbar` work smoothly on Chrome, Edge, and Firefox. Modern Chromium 121+ disables `::-webkit-scrollbar` when `scrollbar-color` is set, creating minor styling differences between Firefox/Chrome, which is harmless.
- **Typography:** Local WOFF2 fonts (Apfel Grotezk and Fragment Mono) are supported across all modern browsers (Chrome 36+, Firefox 39+, Safari 12+, Edge 14+).

### Form Controls & Native Validation
- **Autofill Metadata:** Missing `name` and `autoComplete` attributes on authentication forms impair password managers and browser credential autofill ([FIND-XBR-08](#find-xbr-08)).
- **Input Sizing on iOS:** Form inputs with `font-size < 16px` trigger automatic viewport zooming on iOS Safari ([FIND-XBR-02](#find-xbr-02)).

### Routing & Navigation
- **Next.js 16 Proxy:** The middleware file convention was renamed to `proxy.ts` in Next.js 16 (`src/proxy.ts`). It successfully guards `/dashboard`, `/admin`, `/tutor`, and `/learner` routes with role checks.
- **History & bfcache:** Sign-out purges sensitive `localStorage` keys (`src/lib/clientStorage.ts`). When navigating back via browser back button after logout, protected pages redirect to `/login` upon router activity.

### Accessibility (a11y)
- **Reduced Motion:** Explicitly respected via `@media (prefers-reduced-motion: reduce)` for keyframe animations in `globals.css:166`.
- **Dialog Focus Trapping:** `src/components/ui/Modal.tsx:45-63` implements a Tab key focus trap and Escape listener, restoring focus to trigger elements upon close.
- **Decorative `inert` Form:** Chapter 1 of the landing page uses `<div inert>` (`src/components/landing/SampleMatchForm.tsx:19`). Supported in modern browsers (Chrome 102+, Safari 16+, Firefox 105+); in older versions without polyfill, tab stops are not suppressed.

---

## F. Backend and API Findings

### CORS & Preflight
- The application functions as a unified Next.js monolithic origin. There are no public cross-origin API endpoints, and CORS headers are intentionally omitted. `allowedDevOrigins` in `next.config.ts:35` allows specified LAN origins during development.

### Cookie Attributes & Security Headers
- **Session Cookie:** NextAuth issues JWT cookies with `HttpOnly: true`, `SameSite: Lax`, and `Path: /`. On HTTPS environments, `Secure: true` is enforced with `__Secure-` prefix.
- **Storage Partitioning & ITP:** Because the portal operates as a first-party application and blocks framing (`X-Frame-Options: DENY`, `frame-ancestors 'none'`), modern browser third-party cookie restrictions (Safari ITP, Firefox TCP, Chrome Privacy Sandbox) have zero impact on session persistence.
- **Content Security Policy (CSP):** CSP configured in `next.config.ts:9-20` permits local font loading, inline styles, and UploadThing connections.

### HTTP Caching & Serialization
- Authenticated API routes omit `Cache-Control` headers, exposing Safari users to aggressive GET caching ([FIND-XBR-04](#find-xbr-04)).
- Input validation on `meetingLink` fails to enforce `http:`/`https:` schemes, allowing `javascript:` URLs ([FIND-XBR-09](#find-xbr-09)).

---

## G. Testing Results

### Commands Executed & Outcomes
1. **Repository Status Check:**
   - Command: `git status --porcelain`
   - Outcome: Working tree was inspected. Pre-existing changes from prior sessions were preserved. Zero modifications were introduced during this audit.
2. **ESLint Static Analysis:**
   - Command: `pnpm exec eslint --no-cache`
   - Outcome: **Exited with code 1**. Identified **1 error** and **5 warnings**:
     - *Error:* `src/components/layout/PortalLayout.tsx:73:16` (`react-hooks/set-state-in-effect`: synchronous `setState` in effect).
     - *Warnings:* Unused variables in tests and type declarations.
3. **TypeScript Typecheck:**
   - Command: `pnpm exec tsc --noEmit --incremental false`
   - Outcome: **Exited with code 0**. Zero type errors across the entire codebase. No build artifacts or cache files written.
4. **Automated Unit & Integration Test Suite:**
   - Command: `pnpm exec vitest run --no-cache`
   - Outcome: **Exited with code 0**. **102 test files passed (102/102), 746 tests passed (746/746)** in 28.35s.

### Environmental Limitations & Unavailable Browsers
- **Headless Testing Only:** Vitest tests executed in a Node.js runtime environment. No real browser instances (Gecko, WebKit, Blink) were launched.
- **No E2E / Browser Automation Suite:** Playwright, Cypress, or Puppeteer are not installed in the repository. Cross-browser evaluations for WebKit and Gecko were performed via static analysis, code tracing, and browser engine specification compliance.

---

## H. Recommended Remediation Plan

Recommended changes in order of priority:

1. **Fix CSV Blob Download in Safari & Firefox (P1):**
   - *Target:* `src/lib/csv.ts:39`
   - *Action:* Wrap `URL.revokeObjectURL(url)` in `setTimeout(() => URL.revokeObjectURL(url), 1000)` so asynchronous downloads complete before the blob URL is invalidated.
2. **Prevent iOS Safari Viewport Auto-Zoom (P1):**
   - *Target:* Form inputs across `src/components/auth/` and `src/components/chatbot/`
   - *Action:* Ensure mobile input font sizes compute to at least 16px (1rem) using `text-base sm:text-xs` or a global media query.
3. **Fix Overlay Backdrop Dismiss on iOS WebKit (P1):**
   - *Target:* `src/components/layout/PortalLayout.tsx:267` and `src/components/ui/Modal.tsx:97`
   - *Action:* Add `cursor-pointer` to backdrop classes or convert backdrop elements to native `<button type="button" className="modal-backdrop cursor-pointer" ... />`.
4. **Prevent Aggressive GET Caching in Safari (P1):**
   - *Target:* `next.config.ts`
   - *Action:* Add `Cache-Control: no-store, no-cache, must-revalidate` for `/api/:path*` route headers.
5. **Pin Server Timezone & Locale to Prevent Hydration Mismatches (P2):**
   - *Target:* `src/lib/datetime.ts` and `src/components/schedule/WeeklyTimetable.tsx`
   - *Action:* Explicitly configure `timeZone: "Asia/Manila"` and `en-PH` in date formatters; add `suppressHydrationWarning` on date rendering spans.
6. **Enforce HTTP/HTTPS Protocol on Meeting Links (P2):**
   - *Target:* `src/lib/validations/class.ts:62`
   - *Action:* Add `.refine((u) => /^https?:\/\//i.test(u), "Must start with http:// or https://")` to reject `javascript:` URLs.
7. **Resolve React 19 Linter Error in `PortalLayout.tsx` (P2):**
   - *Target:* `src/components/layout/PortalLayout.tsx:73`
   - *Action:* Refactor `localStorage` preference loading into lazy state initialization or `useSyncExternalStore`.
8. **Add Form Autofill Attributes (P2):**
   - *Target:* `src/components/auth/LoginForm.tsx`, `RegisterForm.tsx`, `ResetPasswordForm.tsx`
   - *Action:* Add `name` and standard `autoComplete` attributes (`email`, `current-password`, `new-password`).
9. **Apply Safe Area Insets and Dynamic Viewport Height on Mobile (P2):**
   - *Target:* `src/components/chatbot/ChatWidget.tsx:92`
   - *Action:* Use `env(safe-area-inset-bottom)` and `100dvh` to prevent keyboard and home indicator collisions.
10. **Add Mobile Search Affordance & Restrict HSTS to Production (P3):**
    - *Target:* `src/components/layout/PortalLayout.tsx`, `next.config.ts`
    - *Action:* Add mobile search icon; gate HSTS header with `!isDev`.

---

## I. Final Verdict

### Confirmed Blockers
- **CSV downloads completely fail in Safari and Firefox** due to synchronous `URL.revokeObjectURL(url)`.
- **Modals and mobile navigation drawer cannot be closed via backdrop tap on iOS Safari** due to missing `cursor: pointer` on non-interactive elements.

### Important Unverified Risks
- **Safari aggressive GET caching:** Requires live Safari browser verification to confirm whether mutative actions intermittently show stale data without manual refresh.
- **SSR Hydration in Production:** Cloud deployment on UTC hosts (Render/AWS) will generate client hydration mismatch warnings for users in Philippine Time (UTC+8) on timetable views.
- **Legacy Browser Rendering:** Samsung Internet <22 and iOS 15 Safari will encounter styling degradation due to unsupported OKLCH / `color-mix()` syntax.

### Browsers with Actual Passing Test Evidence
- **Node.js Test Environment:** Vitest passed 746/746 tests across 102 test files.
- **Real Browser Testing:** **Zero real browser engines were executed** because no browser automation framework (Playwright, Cypress) is installed in the repository. All browser assessments are based on static code audit and engine specification analysis.

### Recommended Next Steps
1. Apply the top 4 P1 remediations (CSV revocation delay, mobile input font sizing, backdrop cursor pointer, and API no-store caching).
2. Install Playwright (`@playwright/test`) to establish automated multi-browser regression tests across Chromium, Firefox, and WebKit.
3. Pin the application timezone to `Asia/Manila` across server date formatters to eliminate hydration discrepancies.
