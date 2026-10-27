# Comprehensive Testing Checklist: Grade-Level Restrictions & Separated Date/Time Inputs

**Target System:** Katuwang (Peer Tutoring & Academic Support Platform)  
**Branches Covered:**
1. `feature/grade-level-restrictions` (Grade-based teaching & enrollment restriction system)
2. `fix/separate-time-date-inputs` (Separated Date and Time inputs across scheduling forms)

---

## Table of Contents
1. [Prerequisites & Test Accounts](#1-prerequisites--test-accounts)
2. [Branch 1: `feature/grade-level-restrictions`](#2-branch-1-featuregrade-level-restrictions)
   - [2.1 Tutor Class Creation & Editing](#21-tutor-class-creation--editing)
   - [2.2 Learner Class Discovery & Search](#22-learner-class-discovery--search)
   - [2.3 Class Detail View & Direct URL Protection](#23-class-detail-view--direct-url-protection)
   - [2.4 Class Enrollment Enforcement](#24-class-enrollment-enforcement)
   - [2.5 Auto-Match & Chatbot Recommendations](#25-auto-match--chatbot-recommendations)
   - [2.6 Topic Request Creation & Directed Tutor Selection](#26-topic-request-creation--directed-tutor-selection)
   - [2.7 Tutor Topic Request Acceptance & Pool Visibility](#27-tutor-topic-request-acceptance--pool-visibility)
   - [2.8 Tutor Public Profile & Weekly Timetable](#28-tutor-public-profile--weekly-timetable)
   - [2.9 Direct API Security Verification](#29-direct-api-security-verification)
   - [2.10 Automated Test Commands](#210-automated-test-commands)
3. [Branch 2: `fix/separate-time-date-inputs`](#3-branch-2-fixseparate-time-date-inputs)
   - [3.1 Switching to the Fix Branch](#31-switching-to-the-fix-branch)
   - [3.2 Tutor Class Creation (`/tutor/classes/new`)](#32-tutor-class-creation-tutorclassesnew)
   - [3.3 Add Session Modal in Class Edit (`/tutor/classes/[classId]/edit`)](#33-add-session-modal-in-class-edit-tutorclassesclassidedit)
   - [3.4 Reschedule Session Modal (`SessionActions.tsx`)](#34-reschedule-session-modal-sessionactionstsx)
   - [3.5 Accept Topic Request Form (`/tutor/requests/[id]/accept`)](#35-accept-topic-request-form-tutorrequestsidaccept)
   - [3.6 Timezone, Validation & Edge Cases](#36-timezone-validation--edge-cases)
   - [3.7 Automated Test Commands](#37-automated-test-commands)

---

## 1. Prerequisites & Test Accounts

### Test Personas Matrix
To thoroughly test grade restrictions, ensure you have user accounts matching these grade levels (or create them via `/dev` or registration):

| Role | Username / ID | Grade Level | Capabilities & Allowed Target |
|---|---|---|---|
| **Tutor 1** | Tutor G9 | `GRADE_9` | Can teach Grades 7, 8, 9; Target grade dropdown allows only ≤ Grade 9 |
| **Tutor 2** | Tutor G10 | `GRADE_10` | Can teach Grades 7, 8, 9, 10; Target grade dropdown allows only ≤ Grade 10 |
| **Tutor 3** | Tutor G12 | `GRADE_12` | Can teach all grades (7–12); Target grade dropdown allows all grades |
| **Learner 1**| Learner G7 | `GRADE_7` | Can enroll in any tutor's class (G7–G12) targeted at G7 or open |
| **Learner 2**| Learner G9 | `GRADE_9` | Can enroll in G9, G10, G11, G12 tutor classes targeted at G9+ or open |
| **Learner 3**| Learner G10 | `GRADE_10`| Can enroll in G10, G11, G12 tutor classes; **CANNOT** enroll in G9 tutor classes |

> [!TIP]
> Fast login is available on development environments at `/dev/login`.

---

## 2. Branch 1: `feature/grade-level-restrictions`

Ensure you are on the feature branch:
```bash
git checkout feature/grade-level-restrictions
```

### 2.1 Tutor Class Creation & Editing
- [ ] **Target Grade Dropdown Options (Grade 9 Tutor):**
  - Sign in as **Tutor G9** (`GRADE_9`).
  - Navigate to `/tutor/classes/new`.
  - Open the **Target Grade Level** dropdown.
  - **Verify:** Only `Open to all eligible grades`, `Grade 7`, `Grade 8`, and `Grade 9` are selectable.
  - **Verify:** `Grade 10`, `Grade 11`, and `Grade 12` do **NOT** appear in the list.
- [ ] **Target Grade Dropdown Options (Grade 12 Tutor):**
  - Sign in as **Tutor G12** (`GRADE_12`).
  - Navigate to `/tutor/classes/new`.
  - **Verify:** All grade levels (Grade 7 through Grade 12) appear in the dropdown.
- [ ] **Class Edit Form (Grade 9 Tutor):**
  - Open an existing class edit page: `/tutor/classes/[classId]/edit`.
  - **Verify:** The target grade dropdown only shows `Grade 9` and below.
- [ ] **Client-Side Bypass Prevention:**
  - Attempt to inspect the DOM and alter `<option value="GRADE_10">Grade 10</option>` then submit.
  - **Verify:** Form submission fails with validation error `"Target grade cannot be higher than your current grade level."`.

---

### 2.2 Learner Class Discovery & Search
- [ ] **Learner Grade 9 Class Browser (`/learner/classes`):**
  - Create the following classes:
    - **Class A**: Taught by Tutor G9, Target Grade = `GRADE_9`
    - **Class B**: Taught by Tutor G9, Target Grade = `GRADE_8`
    - **Class C**: Taught by Tutor G8 (or G7), Target Grade = `GRADE_7`
    - **Class D**: Taught by Tutor G10, Target Grade = `GRADE_9`
    - **Class E**: Taught by Tutor G10, Target Grade = `Open (null)`
    - **Class F**: Taught by Tutor G10, Target Grade = `GRADE_10`
  - Sign in as **Learner G9** (`GRADE_9`) and navigate to `/learner/classes`.
  - **Verify Class A is VISIBLE** (`studentGrade 9 <= tutorGrade 9`, `target 9 >= student 9`).
  - **Verify Class B is HIDDEN** (`target 8 < student 9` — class is targeted at lower grades).
  - **Verify Class C is HIDDEN** (`tutorGrade 8 < student 9` — tutor is in a lower grade).
  - **Verify Class D is VISIBLE** (`tutorGrade 10 >= student 9`, `target 9 >= student 9`).
  - **Verify Class E is VISIBLE** (`tutorGrade 10 >= student 9`, `target null` is open).
  - **Verify Class F is VISIBLE** (`tutorGrade 10 >= student 9`, `target 10 >= student 9`).
- [ ] **Learner Grade 10 Class Browser (`/learner/classes`):**
  - Sign in as **Learner G10** (`GRADE_10`).
  - **Verify:** Neither Class A, Class B, nor Class C is visible (all taught by Tutor G9 or lower).
  - **Verify:** Class D is **HIDDEN** (`target 9 < student 10`).
  - **Verify:** Class E and Class F are **VISIBLE**.
- [ ] **Grade Level Filter Dropdown on Learner Browse:**
  - As **Learner G9**, inspect the Grade filter dropdown on `/learner/classes`.
  - **Verify:** Only `Grade 9`, `Grade 10`, `Grade 11`, and `Grade 12` appear as filter options (lower grades filtered out).
- [ ] **Global Search (`⌘K` or Search Bar):**
  - As **Learner G10**, search for the code or subject of Class A (taught by Tutor G9).
  - **Verify:** Class A does **NOT** appear in search suggestions or search results.
  - Search for Tutor G9 by anonymous ID (`TUT-xxxx`).
  - **Verify:** Tutor G9 does **NOT** appear in tutor search results for Learner G10.

---

### 2.3 Class Detail View & Direct URL Protection
- [ ] **Direct URL Navigation to Ineligible Class:**
  - Copy the URL of Class A (`/learner/classes/[classId-Class-A]`, taught by Tutor G9).
  - Sign in as **Learner G10** (`GRADE_10`).
  - Paste the URL directly into the browser address bar.
  - **Verify:** The application renders a standard **404 Not Found** page (`notFound()`).
  - **Verify:** The student cannot view class details, tutor name, syllabus, or session times.
- [ ] **Direct URL Navigation to Eligible Class:**
  - Navigate to Class F (`/learner/classes/[classId-Class-F]`).
  - **Verify:** The class detail page loads normally with full details and the Enroll button.

---

### 2.4 Class Enrollment Enforcement
- [ ] **Frontend Enrollment Button:**
  - Verify that no "Enroll" button is accessible for any ineligible class.
- [ ] **API Security Validation (Tampered Request):**
  - As **Learner G10**, send a direct `POST /api/classes/[classId-Class-A]/enroll` request.
  - **Verify:** Server responds with **`403 Forbidden`**.
  - **Verify:** Response payload contains:
    ```json
    { "error": "You cannot enroll in a class taught by a tutor in a lower grade level." }
    ```
- [ ] **Class Target Grade Violation (Tampered Request):**
  - As **Learner G10**, send a `POST /api/classes/[classId-Class-D]/enroll` (Tutor is G10, but target grade is G9).
  - **Verify:** Server responds with **`403 Forbidden`**.
  - **Verify:** Response payload contains:
    ```json
    { "error": "You cannot enroll in a class targeted at a lower grade level than your own." }
    ```
- [ ] **Valid Enrollment:**
  - As **Learner G9**, click "Enroll" on Class A or Class D.
  - **Verify:** Enrollment succeeds (HTTP 201), user is redirected to class dashboard, and tutor is notified.

---

### 2.5 Auto-Match & Chatbot Recommendations
- [ ] **Auto Match Tool (`/learner/classes` or `/`):**
  - Sign in as **Learner G10**.
  - Submit the Auto-Match form requesting math topics.
  - **Verify:** Suggested matches **NEVER** include classes taught by Grade 9 tutors.
- [ ] **Chatbot Assistant:**
  - Open the chatbot widget in the bottom-right corner as **Learner G10**.
  - Ask: *"Recommend a math class"* or *"Find math tutor"*.
  - **Verify:** Returned class cards and recommendations only include eligible tutors and classes.

---

### 2.6 Topic Request Creation & Directed Tutor Selection
- [ ] **Learner Topic Request (`/learner/topic-requests`):**
  - Sign in as **Learner G9**.
  - Open the "Post a topic request" modal.
  - In the "Direct to a specific tutor" field, look for available tutors.
  - Select **Tutor G10** -> **Verify:** Request is accepted and saved.
  - Attempt to submit directed to **Tutor G8** (via direct API `POST /api/learner/topic-requests` with `directedTutorId: "id-tutor-g8"`).
  - **Verify:** API rejects with **`403 Forbidden`**:
    ```json
    { "error": "You cannot request tutoring from a tutor in a lower grade level." }
    ```

---

### 2.7 Tutor Topic Request Acceptance & Pool Visibility
- [ ] **Tutor Open Requests Pool (`/tutor/requests`):**
  - Have **Learner G10** create a public topic request in Science.
  - Have **Learner G8** create a public topic request in Science.
  - Sign in as **Tutor G9** and navigate to `/tutor/requests` (Open Requests tab).
  - **Verify:** The Grade 8 request is **VISIBLE**.
  - **Verify:** The Grade 10 request is **HIDDEN** from Tutor G9's pool.
- [ ] **Tutor Request Acceptance (`/tutor/requests/[id]/accept`):**
  - As **Tutor G9**, open an eligible request.
  - In the class creation schedule fields, verify the target grade dropdown only permits Grade 9 and below.
  - Attempt to accept a Grade 10 request via direct API (`POST /api/tutor/topic-requests/[id-g10]/accept`).
  - **Verify:** Server returns **`403 Forbidden`**:
    ```json
    { "error": "You cannot teach students in a higher grade level than your own." }
    ```

---

### 2.8 Tutor Public Profile & Weekly Timetable
- [ ] **Find Tutors Listing (`/learner/tutors`):**
  - Sign in as **Learner G10**.
  - Navigate to `/learner/tutors`.
  - **Verify:** Tutors in Grade 9 or below do **NOT** appear in the browsable tutor list.
- [ ] **Tutor Profile Timetable (`/learner/tutors/[tutorId]`):**
  - As **Learner G10**, navigate to the profile of Tutor G10.
  - Tutor G10 has two classes: one targeting Grade 10, one targeting Grade 8.
  - **Verify:** Only the Grade 10 class and its timetable slots appear on the profile.
  - **Verify:** The Grade 8 class is filtered out.
- [ ] **"Request a class" Button on Tutor Profile:**
  - If a learner visits a tutor who is in a lower grade level, verify that the **"Request a class"** button is completely hidden.

---

### 2.9 Direct API Security Verification
- [ ] Verify that direct curl requests without frontend validation cannot bypass rules:
  ```bash
  # Attempt to create a class targeting a higher grade (Tutor is G9, target is G10)
  curl -X POST http://localhost:3000/api/tutor/classes \
    -H "Content-Type: application/json" \
    -H "Cookie: <tutor-session-cookie>" \
    -d '{"subject":"MATH","gradeLevel":"GRADE_10","sessions":[{"scheduledAt":"2027-01-01T08:00:00Z","duration":60}]}'
  # Expected: HTTP 400 {"error":"Target grade cannot be higher than your current grade level."}
  ```

---

### 2.10 Automated Test Commands
Run the automated test suites to ensure 100% test pass rate:
```bash
# 1. Run grade-level utility unit tests
pnpm exec vitest run src/lib/__tests__/gradeLevels.test.ts

# 2. Run class query tests
pnpm exec vitest run src/lib/__tests__/classQueries.test.ts

# 3. Run tutor class API tests
pnpm exec vitest run src/app/api/tutor/classes/__tests__/route.test.ts
pnpm exec vitest run src/app/api/tutor/classes/[classId]/__tests__/route.test.ts

# 4. Run enrollment restriction API tests
pnpm exec vitest run src/app/api/classes/[classId]/enroll/__tests__/route.test.ts

# 5. Run topic request restriction API tests
pnpm exec vitest run src/app/api/learner/topic-requests/__tests__/route.test.ts
pnpm exec vitest run src/app/api/tutor/topic-requests/[id]/accept/__tests__/route.test.ts

# 6. Run full test suite, typecheck, and lint
pnpm exec vitest run
pnpm exec tsc --noEmit
pnpm lint
```

---

## 3. Branch 2: `fix/separate-time-date-inputs`

### 3.1 Switching to the Fix Branch
To test the separated date and time inputs:
```bash
# Checkout the fix branch
git checkout fix/separate-time-date-inputs

# If changes are stashed, restore them:
git stash pop
```

---

### 3.2 Tutor Class Creation (`/tutor/classes/new`)
- [ ] **UI Rendering:**
  - Sign in as a tutor and open `/tutor/classes/new`.
  - Scroll down to the **Class Schedule** section.
  - **Verify:** Each session row contains two separate input fields:
    - **Date:** `<input type="date">`
    - **Start Time:** `<input type="time">`
  - **Verify:** The previous combined `datetime-local` input is gone.
- [ ] **Past Date Prevention:**
  - Check the `min` attribute of the date picker.
  - **Verify:** Dates earlier than today are disabled / not selectable in the calendar picker.
- [ ] **Incomplete Input Handling:**
  - Select a **Date** but leave **Start Time** blank.
  - Click "Publish Class" or "Create Class".
  - **Verify:** Form validation blocks submission and displays: *"Please specify both a date and a start time."*
  - Select a **Start Time** but leave **Date** blank.
  - **Verify:** Form validation blocks submission.
- [ ] **Multiple Sessions Creation:**
  - Click "+ Add another session".
  - Select distinct dates and times for Session 1 and Session 2.
  - Submit the form.
  - **Verify:** Class is created with correct `scheduledAt` ISO timestamps in UTC corresponding to the selected local date and time.

---

### 3.3 Add Session Modal in Class Edit (`/tutor/classes/[classId]/edit`)
- [ ] **Modal Rendering:**
  - Open an existing scheduled class at `/tutor/classes/[classId]/edit`.
  - Click the **"+ Add Session"** button.
  - **Verify:** The modal displays separate **Date** (`<input type="date">`) and **Start Time** (`<input type="time">`) fields.
- [ ] **Submission & State Update:**
  - Pick a date and time for next week.
  - Click "Add Session".
  - **Verify:** Modal closes, new session row appears in the session list with the correct formatted date and time.
  - **Verify:** Does not reset or prematurely submit the outer class edit form.

---

### 3.4 Reschedule Session Modal (`SessionActions.tsx`)
- [ ] **Pre-population of Existing Session:**
  - On the class details page (`/tutor/classes/[classId]`) or edit page, find an existing scheduled session.
  - Click the **Reschedule** (pencil) icon.
  - **Verify:** The modal opens.
  - **Verify:** The **Date** field is pre-populated with the session's existing local date (`YYYY-MM-DD`).
  - **Verify:** The **Start Time** field is pre-populated with the session's existing local time (`HH:mm`).
- [ ] **Reschedule Execution:**
  - Change the time from `09:00` to `14:30`.
  - Click "Save Changes" / "Reschedule".
  - **Verify:** Session updates successfully.
  - **Verify:** The updated time reflects as `2:30 PM` on the session card and timetable.

---

### 3.5 Accept Topic Request Form (`/tutor/requests/[id]/accept`)
- [ ] **Accept Request Schedule Rows:**
  - As a tutor, open `/tutor/requests/[requestId]/accept`.
  - Scroll down to the session scheduling section.
  - **Verify:** Sessions use the separated **Date** and **Time** fields.
  - **Verify:** Preferred learner times (if specified in the request) can be easily typed or matched using the separate pickers.
  - Submit the acceptance.
  - **Verify:** Class is successfully created with accurate session timestamps.

---

### 3.6 Timezone, Validation & Edge Cases
- [ ] **Timezone Integrity (No Day Shift):**
  - In a Philippine Time (UTC+8) environment, create a session scheduled at `2026-11-15 08:00 AM`.
  - Inspect the stored `scheduledAt` or network payload.
  - **Verify:** Payload sends `2026-11-15T00:00:00.000Z` (UTC).
  - Inspect the rendered UI in learner and tutor portals.
  - **Verify:** Displays as `Nov 15, 2026, 8:00 AM` (does NOT shift to the previous day or alter hours).
- [ ] **Past Time on Today's Date:**
  - Select today's date in the date picker.
  - Select a time that is 2 hours in the past.
  - Submit the form.
  - **Verify:** Validation error is shown: *"Session cannot be scheduled in the past."*

---

### 3.7 Automated Test Commands
Run the datetime helper tests:
```bash
# Run datetime utility tests
pnpm exec vitest run src/lib/__tests__/datetime.test.ts

# Typecheck and lint
pnpm exec tsc --noEmit
pnpm lint
```

---

## 4. Final Sign-Off Checklist

| Test Phase | Tester | Date | Result (`PASS` / `FAIL`) | Notes |
|---|---|---|---|---|
| Grade Restrictions — Tutor Class Creation | | | | |
| Grade Restrictions — Learner Browsing & Search | | | | |
| Grade Restrictions — Class Enrollment | | | | |
| Grade Restrictions — Topic Requests | | | | |
| Grade Restrictions — Direct API Protection | | | | |
| Separated Date/Time — Class Creation | | | | |
| Separated Date/Time — Add Session Modal | | | | |
| Separated Date/Time — Reschedule Modal | | | | |
| Separated Date/Time — Accept Request Form | | | | |
| Separated Date/Time — Timezone & Formatting | | | | |
