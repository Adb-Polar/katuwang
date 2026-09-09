# Katuwang — Data Flow Diagrams (Level 0 & Level 1)

Prepared for the Capstone 2 panel presentation (IT 124, Module 01 — System
Design Refinement). The diagrams reflect the **system as actually built**:
every process maps to a real portal area + API route group, and every data
store maps to one or a tight cluster of Prisma models in
`prisma/schema.prisma` / `docs/erd.md`.

Rendered images live beside this file: `dfd-level0.png/.svg`,
`dfd-level1.png/.svg` (regenerate with `mmdc -i dfd-levelN.mmd -o dfd-levelN.png`).

**Notation** (Yourdon / DeMarco, drawn as a Mermaid flowchart):

| Symbol | Meaning |
|---|---|
| rectangle | External entity — a role or an outside service (the system boundary) |
| circle `(( ))` | Process — a transformation the system performs |
| open-ended box `[( )]` | Data store — persisted data |
| labelled arrow | Data flow (what moves, not control) |

Gated features: process **7.0** runs only when `sessionTestsEnabled`; the
chatbot assistant (a Level-2 detail of user support, not shown here) only when
`chatbotEnabled`. Both are `PlatformSetting`s, default on.

The double-blind anonymity mandate (RA 10173) lives on every learner⇄tutor
flow: they carry only the anonymous ID (`STU-####` / `TUT-####`), never a real
name, email, or contact detail.

---

## Level 0 — Context Diagram

The whole platform as a single process, showing only its boundary and the four
external entities it exchanges data with.

![Level 0 context diagram](dfd-level0.png)

```mermaid
%%{init: {"flowchart": {"curve": "basis", "nodeSpacing": 60, "rankSpacing": 130}} }%%
flowchart LR
    L["Student<br/>Learner"]
    T["Student<br/>Tutor"]
    A["Administrator"]
    M["Email / SMTP<br/>Service"]

    P(("0<br/>Katuwang<br/>Peer Tutoring<br/>Platform"))

    L ==>|"registration, login &amp; profile edits"| P
    L ==>|"browse, match, enrol &amp; class requests"| P
    L ==>|"pre/post-test answers &amp; chatbot messages"| P
    P ==>|"anonymous ID, session, class list, matches &amp; schedule"| L
    P ==>|"test scores, progress deltas, replies &amp; notifications"| L

    T ==>|"application, login &amp; certification quiz answers"| P
    T ==>|"class, session &amp; session-test definitions"| P
    T ==>|"class-request acceptance &amp; class appeals"| P
    P ==>|"approval, anonymous ID, qualifying quiz &amp; certification result"| T
    P ==>|"roster, session-test results, appeal decisions &amp; notifications"| T

    A ==>|"registration, account, class &amp; appeal decisions"| P
    A ==>|"certification review, question bank &amp; assessment config"| P
    A ==>|"platform settings &amp; report queries"| P
    P ==>|"review queues, aggregate reports &amp; audit log"| A
    P ==>|"moderation outcomes &amp; notifications"| A

    P ==>|"password-reset link &amp; account-recovery mail"| M

    classDef ext fill:#F4F5F7,stroke:#5B5B66,stroke-width:1.5px,color:#1B1B1F;
    classDef proc fill:#EEF3FE,stroke:#2F6FED,stroke-width:2.5px,color:#1E4CA8;
    class L,T,A,M ext;
    class P proc;
```

### External entities

| Entity | Role in the system |
|---|---|
| **Student Learner** (`STUDENT_LEARNER`) | Browses / enrols in classes, gets matched, posts class requests, takes session pre/post-tests. |
| **Student Tutor** (`STUDENT_TUTOR`) | Applies to tutor, earns per-topic certification, creates classes & sessions, builds session tests, fulfils class requests, appeals class moderation. |
| **Administrator** (`ADMIN`) | Reviews tutor registrations, moderates accounts / classes / requests, reviews certifications, maintains the question bank & assessment config, sets platform settings, reads analytics & audit log. |
| **Email / SMTP Service** | Outside service (`src/lib/mail.ts`) that delivers password-reset links and account-recovery mail. Delivery to the user's inbox is outside the system boundary. |

---

## Level 1 — Decomposition

Process 0 exploded into the eight processes the platform runs. Each is a
coherent module boundary; the numbering is reused in the presentation speaker
notes. All processes emit notification rows to **DS10** — three representative
flows are drawn, the rest omitted for clarity. Fine-grained admin actions and
the chatbot assistant decompose further at Level 2.

![Level 1 DFD](dfd-level1.png)

```mermaid
%%{init: {"flowchart": {"curve": "basis", "nodeSpacing": 50, "rankSpacing": 70}} }%%
flowchart TB
    L["Student<br/>Learner"]
    T["Student<br/>Tutor"]
    A["Administrator"]
    MAIL["Email / SMTP<br/>Service"]

    P1(("1.0<br/>Registration &amp;<br/>Authentication"))
    P2(("2.0<br/>Account &amp; Platform<br/>Administration"))
    P3(("3.0<br/>Tutor Topic<br/>Certification"))
    P4(("4.0<br/>Class &amp; Session<br/>Management"))
    P5(("5.0<br/>Class Discovery<br/>&amp; Enrolment"))
    P6(("6.0<br/>Class<br/>Requests"))
    P7(("7.0<br/>Session Pre/Post<br/>Testing"))
    P8(("8.0<br/>Notification<br/>Delivery"))

    DS1[("DS1 · Users &amp; Tutor Profiles")]
    DS2[("DS2 · Subjects &amp; Topics")]
    DS3[("DS3 · Topic Certifications")]
    DS4[("DS4 · Question Bank &amp; Attempts")]
    DS5[("DS5 · Tutor Classes &amp; Sessions")]
    DS6[("DS6 · Class Enrolments")]
    DS7[("DS7 · Class Requests")]
    DS8[("DS8 · Session Tests &amp; Attempts")]
    DS9[("DS9 · Class Appeals")]
    DS10[("DS10 · Notifications")]
    DS11[("DS11 · Audit Log")]
    DS12[("DS12 · Platform &amp; Assessment Settings")]

    L -->|"registration / login / forgot-password"| P1
    T -->|"tutor application / login"| P1
    DS1 -->|"credential &amp; status check"| P1
    P1 -->|"account (tutor = PENDING) + anonymous ID"| DS1
    P1 -->|"reset link / recovery mail"| MAIL
    P1 -->|"session (JWT) + anonymous ID"| L
    P1 -->|"session (JWT) + anonymous ID"| T

    A -->|"registration / account / class / appeal decisions"| P2
    A -->|"question bank, assessment config, settings, catalogue"| P2
    A -->|"report &amp; audit queries"| P2
    DS1 -->|"registration &amp; account queue"| P2
    DS5 -->|"class review queue &amp; metrics"| P2
    DS11 -->|"action history"| P2
    P2 -->|"status ACTIVE / DECLINED / SUSPENDED / BANNED"| DS1
    P2 -->|"subject &amp; topic catalogue"| DS2
    P2 -->|"bank questions + options"| DS4
    P2 -->|"class status + reason"| DS5
    P2 -->|"appeal outcome"| DS9
    P2 -->|"platform + assessment config"| DS12
    P2 -->|"moderation action record"| DS11
    P2 -->|"review queues, reports, audit log"| A

    T -->|"certification request + quiz answers"| P3
    A -->|"certify / reject + note"| P3
    DS4 -->|"question set (origin = BANK)"| P3
    DS12 -->|"pass % + attempt limit"| P3
    P3 -->|"attempt + graded items"| DS4
    P3 -->|"row PENDING &rarr; CERTIFIED / REJECTED"| DS3
    P3 -->|"qualifying quiz + result"| T
    P3 -->|"certification-decided notice"| DS10

    T -->|"class + session definitions"| P4
    DS3 -->|"eligibility: CERTIFIED per topic"| P4
    DS2 -->|"valid subject / topic"| P4
    DS6 -->|"roster"| P4
    P4 -->|"classes + class-topics + sessions"| DS5
    P4 -->|"roster (anonymised)"| T

    L -->|"browse / search / auto-match + enrol request"| P5
    DS5 -->|"open classes + capacity + status"| P5
    DS2 -->|"subject / topic list"| P5
    DS1 -->|"tutor directory (anonymised)"| P5
    P5 -->|"ranked classes / matches / directory"| L
    P5 -->|"enrol / withdraw row"| DS6
    P5 -->|"new-enrolment notice"| DS10

    L -->|"class request (topics + availability slots)"| P6
    T -->|"accept + attach a class"| P6
    A -->|"request moderation (hide / remove)"| P6
    DS7 -->|"open / directed requests"| P6
    P6 -->|"request + topics + slots ; status FULFILLED"| DS7
    P6 -->|"class created from request"| DS5
    P6 -->|"matching open requests"| T
    P6 -->|"class-request-accepted notice"| DS10

    T -->|"session-test definition + question set"| P7
    L -->|"PRE answers / POST answers"| P7
    A -->|"read-only results view"| P7
    DS4 -->|"selected bank questions"| P7
    DS5 -->|"session lifecycle (PRE on publish, POST on COMPLETED)"| P7
    DS6 -->|"enrolment check"| P7
    P7 -->|"tests + attempts (kind PRE / POST)"| DS8
    P7 -->|"score + feedback + progress delta"| L
    P7 -->|"class pre &rarr; post results (anonymised)"| T

    DS10 -->|"unread rows"| P8
    L -->|"fetch / mark read"| P8
    T -->|"fetch / mark read"| P8
    A -->|"fetch / mark read"| P8
    P8 -->|"unread list + badge"| L
    P8 -->|"unread list + badge"| T
    P8 -->|"unread list + badge"| A

    classDef ext fill:#F4F5F7,stroke:#5B5B66,stroke-width:1.5px,color:#1B1B1F;
    classDef proc fill:#EEF3FE,stroke:#2F6FED,stroke-width:2.5px,color:#1E4CA8;
    classDef store fill:#FCF3E6,stroke:#E88C30,stroke-width:1.3px,color:#1B1B1F;
    class L,T,A,MAIL ext;
    class P1,P2,P3,P4,P5,P6,P7,P8 proc;
    class DS1,DS2,DS3,DS4,DS5,DS6,DS7,DS8,DS9,DS10,DS11,DS12 store;
```

### Process catalogue

| # | Process | What it does | Portal / route group |
|---|---|---|---|
| 1.0 | Registration & Authentication | Learner self-registration; tutor application (lands `PENDING`); credential login (NextAuth JWT); forgot / reset password; atomic anonymous-ID issue via `generateAnonymousId()`. | `/register`, `/api/register`, `/api/auth/*` |
| 2.0 | Account & Platform Administration | Approve / decline tutor registrations; suspend / ban / reactivate accounts; edit subjects & topics; author bank questions & resolve question requests; set platform + assessment config; read reports & audit log. *(Level-2: registration review, account moderation, question bank, settings, analytics are separate subprocesses.)* | `/admin/users`, `/admin/registrations`, `/admin/subjects`, `/admin/assessment/*`, `/admin/settings`, `/admin/reports`, `/admin/audit-log` |
| 3.0 | Tutor Topic Certification | Tutor requests certification per (subject, topic); qualifying quiz drawn from the bank (`origin = BANK`); auto-grade against the snapshot pass %; admin certify / reject with note; "please add questions" requests. | `/tutor/assessments`, `/api/tutor/topic-certifications`, `/api/tutor/assessments/*`, `/admin/assessment/certifications` |
| 4.0 | Class & Session Management | Tutor creates a `TutorClass` (subject, topics, capacity, schedule) — **gated on a `CERTIFIED` row per topic** — then schedules / edits / cancels `ClassSession`s and views the anonymised roster. | `/tutor/classes`, `/tutor/classes/new`, `/api/tutor/classes/*` |
| 5.0 | Class Discovery & Enrolment | Learner browses / searches open classes; weighted matching (`src/lib/matching.ts`: subject, topic overlap, grade-level fit, schedule fit); enrol / unenrol within capacity; anonymised tutor directory. | `/learner/classes`, `/learner/match`, `/learner/tutors`, `/api/classes`, `/api/learner/match`, `/api/classes/[classId]/enroll` |
| 6.0 | Class Requests | Learner posts a `TopicRequest` (topics + availability slots + preferred setup) when no class fits; open / directed visibility rules; a tutor accepts and attaches a class; admin can moderate. | `/learner/requests`, `/tutor/requests`, `/api/tutor/topic-requests/[id]/accept`, `/admin/topic-requests` |
| 7.0 | Session Pre/Post Testing | Tutor builds one `SessionTest` per `ClassSession` (bank + self-authored questions); an enrolled learner takes the same set as a `PRE` then a `POST` attempt; per-question pre→post delta. `sessionTestsEnabled`-gated. | `/tutor/classes/[classId]/sessions/[sessionId]/test`, `/learner/.../test/[kind]`, `/admin/session-tests` |
| 8.0 | Notification Delivery | Serves each user their unread `Notification` rows + badge and marks them read. In-app only — no scheduler / push. | `/api/notifications`, `/api/notifications/read`, `/{role}/notifications` |

### Data-store → Prisma model map

| Store | Prisma model(s) |
|---|---|
| DS1 Users & Tutor Profiles | `User`, `TutorProfile`, `IdCounter`, `PasswordResetToken` |
| DS2 Subjects & Topics | `Subject`, `Topic` |
| DS3 Topic Certifications | `TopicCertification` |
| DS4 Question Bank & Attempts | `AssessmentQuestion`, `AssessmentOption`, `AssessmentAttempt`, `AssessmentAttemptItem`, `QuestionRequest` |
| DS5 Tutor Classes & Sessions | `TutorClass`, `ClassTopic`, `ClassSession` |
| DS6 Class Enrolments | `ClassEnrollment` |
| DS7 Class Requests | `TopicRequest`, `TopicRequestTopic`, `TopicRequestSlot` |
| DS8 Session Tests & Attempts | `SessionTest`, `SessionTestQuestion`, `SessionTestAttempt`, `SessionTestAttemptItem` |
| DS9 Class Appeals | `ClassAppeal` |
| DS10 Notifications | `Notification` (+ `ChatbotMiss` for the chatbot Level-2 detail) |
| DS11 Audit Log | `AuditLog` |
| DS12 Platform & Assessment Settings | `PlatformSetting` (+ assessment-config keys) |

### Traceability (Design Review Checklist)

- **Every data store maps to a real entity** — see the table above; each store
  is one or a tight cluster of Prisma models in `prisma/schema.prisma` /
  `docs/erd.md`.
- **Every process maps to an architecture component** — each row's route group
  is a slice of the modular-monolith app on the architecture slide (Route
  Handlers under `src/app/api/**` + the matching portal pages).
- **Every refinement traces to a panel recommendation** — panel rec R1 (model
  the tutor certification lifecycle) is process **3.0** plus the eligibility
  gate flow `DS3 → 4.0`. Before refinement this was a single boolean on `DS1`
  with no store of its own — no `DS3`, no gate.
