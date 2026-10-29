# Implementation caveats and explicit assumptions

These notes distinguish documented implementation from inferred intent. They do not change code. Severity/risk prioritization and remediation are outside this documentation change.

## Evidence-backed discrepancies

| Area | Observed behavior | Consequence / interpretation | Source |
| --- | --- | --- | --- |
| Standalone class publication | Handler validates but does not persist published; schema default is true | Even a submitted published:false class starts published; PATCH can unpublish | `api/tutor/classes/route.ts`, schema TutorClass |
| Page versus API status guards | Proxy guards portal paths only; most APIs check session/role but not inactive status | Do not claim suspension immediately blocks every API; JWT refresh only supplies status | `proxy.ts`, `lib/auth.ts`, role handlers |
| Account suspension expiry | Reactivation occurs in credentials authorize, not generic JWT refresh | Expired suspension may require fresh sign-in; no scheduled lift | `lib/auth.ts` |
| Class suspension expiry | Bulk repair on selected learner paths | Admin/Tutor reads can show expired SUSPENDED until repair path runs | `lib/moderation.ts` and call sites |
| Recovery-email registration | Public schema accepts recoveryEmail but registration call/core omits it | Signup does not save a backup address | register handler/core |
| Recovery-email Tutor edits | Shared schema/form support it; Tutor PATCH omits it | Tutor save can succeed without changing recoveryEmail | tutor profile handler |
| Directory versus direct tutor profile | Directory requires ACTIVE tutor with certification; direct profile requires Tutor role/profile only | Known tutor IDs can expose profile beyond directory eligibility; report button only considers published-class relationships | learner tutors API/profile page |
| Contact validation | Signup accepts optional free text, profile update requires PH mobile | Existing signup contact may not satisfy edit rules | auth/profile validations |
| Class update validation | PATCH does not recheck active subject or certifications; UI blocks some completed edits | Describe creation restrictions separately from update/API allowances | Tutor class item route/edit page |
| Lifecycle reversibility | Tutor PATCH allows SCHEDULED/COMPLETED/CANCELLED without strict current-state graph except moderation | Reopening parent does not reset child session statuses | Tutor class item route |
| Delete versus moderation | Class DELETE lacks PATCH moderation restriction if zero enrollments | UI visibility is not equivalent to API denial | Tutor class item route |
| Request acceptance coverage | Eligibility requires overlapping public certified topic, proposed class same subject and certified topics | Does not enforce full original topic/grade/window fulfillment | accept handler/visibility helper |
| Race-prone prechecks | Capacity/quota/OPEN status/token unused checks precede transaction writes | Parallel calls may violate business intent; do not imply serializable checks | enroll, request create/accept, token handlers |
| Diagnostics resume/submit | Start checks feature/enrollment/moderation/test state; own GET/submit primarily check ownership | Existing attempt can remain accessible after closure, disable or unenrollment | Learner attempt handlers |
| PRE/POST timing | Session status, not wall-clock meeting time, controls new starts; POST needs no PRE | Labels “before/after” mean tutor lifecycle state | learner start handler |
| Diagnostic answer reveal | Own Learner reveal waits for SUBMITTED; Tutor/Admin drilldowns use reveal:true | Privileged result paths can reveal keys for IN_PROGRESS attempts | attempt drilldowns/serializers |
| Bank answer secrecy | Tutor bank browser returns options including isCorrect for any active BANK question | Certification bank is not secret from authenticated tutors | tutor/question-bank handler |
| Bank content lock | Admin inUse counts attempt items, not published test links alone | Bank content can change after publication before first attempt; deletes may hit FK constraint | Admin question item route/schema |
| Custom question reuse | PUT allows any own TUTOR question; PATCH topic not revalidated against class | Subject/session-topic restrictions are broader than author-create rules | test/questions and tutor/questions item |
| Report review action | RESOLVE updates report only; moderation is separate | Message “took action” does not imply automatic ban/suspension | abuse-report review route |
| Request event naming | Admin close also emits TOPIC_REQUEST_REOPENED | Interpret message/status, not event name alone | Admin request item route |
| Certification notifications | Admin review emits certification notifications; auto quiz branch directly changes rows | Do not promise identical notifications for automatic certification | quiz submit vs Admin cert review |
| Certification approval | Only checks pending state, not passing-attempt existence | Manual certification request may be approved without a quiz | certification item route |
| Question-request resolution | No bank-count/readiness check during resolve | Tutor notification text may overstate readiness | question request review |
| Parent/child taxonomy active checks | topicExists checks active topics but not parent active flag; some callers separately use subjectExists | Deactivated subject can behave differently between workflows | subjects helper and call sites |
| Static taxonomy remnants | Coverage enumeration and chatbot extraction use compile-time SUBJECT_TOPICS | Dynamic subjects/topics need not appear in all discovery/coverage aids | coverage route/chatbot recommend |
| Cache consistency | Server catalog 60s per-process TTL; client module catalog cache no expiry; class list 60s memory cache | UI may briefly retain prior catalog/class state | subjects, useSubjectCatalog, classBrowserCache |
| Result populations | Per-test learner rows use current enrollments; question rates use submitted attempt rows | Departed learners can affect question rates without learner table row | sessionTestResults |
| Enrollment reporting | Statistics count current enrollment rows by creation date | Unenrolled/deleted records vanish; report is not immutable event history | Admin reports route |
| Time zones | Matching/availability/report bucketing use runtime-local Date methods; rendering uses runtime locale | No explicit school-wide timezone contract is enforced by these helpers | matching, datetime, derivedAvailability, reports |
| Mail documentation | Some FAQ says only password-reset email | Actual current code also sends verification mail | faq.ts vs register/resend handlers |
| Decline comments | Some comments say applicant becomes BANNED | Actual registration decision assigns DECLINED | registrations item route |
| Chatbot schema comment | Comment says no Admin UI in v1 | `/admin/chatbot` and misses API are implemented | schema vs current routes |
| Rights/retention policy | Static privacy/help pages discuss requests and rights | No automated self-service deletion/retention purge endpoint found | pages/routes inventory |
| Development surfaces | Pages only NODE_ENV-gated; API additionally Admin-gated | Non-production login page can expose account identity without existing session | dev pages/API |
| Schema/migration coverage | Current schema includes domains not individually mirrored by latest named migration files | Do not infer deployed schema equals current Prisma schema without database inspection | schema/migrations |

## Assumptions and scope limits

1. **Guest** is a documentation convenience for unauthenticated access; no Guest enum exists.
2. **Student Tutor and Student Learner** are interpreted as school peers because role names, grade enums, consent, UI and help content consistently use that model. No parent/guardian login exists; consent is a boolean declaration rather than a separate approval identity.
3. **Administrator provisioning** is inferred as an operator/seed action because registration accepts only Learner/Tutor and seed/dev code provisions Admin directly. There is no production Admin invitation workflow in current handlers.
4. **MySQL-compatible persistence** follows datasource provider and MariaDB adapter. The configured live database engine/version and deployed schema were not inspected.
5. **External meeting link** is treated as navigation to a provider supplied by the Tutor; code does not provision a video session or verify attendance/provider validity beyond URL syntax.
6. **Teaching availability** is a display of future teaching windows, not free-time capacity or a reservation system. Adjacent/overlapping weekday ranges merge and an over-midnight end label caps at 24:00.
7. **Anonymous/double-blind** describes peer-facing identity choices. Admins see identity, and opaque IDs plus grade/section are present in several DTOs. No stronger cryptographic anonymity is assumed.
8. **No automatic jobs/webhooks** means none were found in tracked application handlers/configuration. An external deployment could run undisclosed services; this analysis cannot assert otherwise.
9. Historical plans, backlog, archived designs, PDFs and slide decks are context rather than implemented feature evidence. Compiled dependencies/generated build output are not independent product workflows.
10. HTTP failures documented per feature are code branches, not a claim that every database constraint/race/SMTP outcome has been reproduced. Common unexpected failures return 500 `{error:...}`; malformed JSON often reaches a general catch rather than a dedicated 400.

## Validation of this documentation

Route and coverage appendices are derived from tracked paths and exported methods. Role/feature chapters were checked against route handlers, validators, Prisma models, helper functions, component actions, test descriptions and current settings. Documentation checks verify local links, role-feature matrix coverage, method/page inventory completeness and Markdown structure. No database writes, seed actions, factory actions, live email tests or deployments were performed for this task.
