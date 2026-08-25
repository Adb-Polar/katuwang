| Sprint | Features | Description | Status | Report |
| - | --- | --- | --- | --- |
| 1 | User Registration | Auto-generates unique student and tutor IDs, validates input using Zod, hashes passwords with Bcrypt, and captures Data Privacy Act consent during sign-up via a dedicated registration form. | Complete | Implemented with auto-generated student/tutor IDs (atomic ID counters), Zod input validation, Bcrypt password hashing, Data Privacy Act consent capture, and full registration form UI for both roles. |
| 1 | User Login/Logout | Handles user authentication through NextAuth's credentials provider, using JWT-based sessions and Bcrypt password comparison for secure login and logout. | Complete | Implemented using NextAuth's credentials provider with JWT-based sessions and Bcrypt password comparison for secure authentication. |
| 1 | Route Protection / Proxy Middleware | Enforces server-side role validation across all portals and API routes to prevent unauthorized access. | Complete | Implemented with server-side role validation (RBAC) enforced across all portals and API routes. |
| 1 | Account Management for Tutor and Learner | Allows tutors and learners to view and update their account details, including profile information and credentials, after registration. | Partial | Core profile viewing and editing is in place; some account settings and update flows are still being refined. |
| 2 | Class Management for Tutor | Provides a UI for tutors to create, view, update, and delete classes, supporting both one-on-one and group (one-to-many) tutoring sessions. | Partial | Class creation and viewing are functional; update and delete actions are still being finalized. |
| 2 | Class Browsing for Learners | Lets learners search and browse available classes, with filters by topic, schedule, and subject. | Partial | Basic browsing works, but filtering by category, time, and subject is still being built out. |
| 2 | Learner Class Enrollment | Enables learners to enroll in or unenroll from a tutor's class. | Partial | Enrollment flow is functional; unenrollment and related edge cases are still in progress. |
| 2 | Schedule Table for Tutor and Learner | Displays a schedule table showing each user's upcoming and ongoing classes. | Not Yet Started | |
| 2 | Student Management for Tutors | Allows tutors to manage the list of learners enrolled in their classes. | Not Yet Started | |
| 3 | Automatic Tutor Matching | Matches learners with suitable tutors using a weighted scoring algorithm based on subject, topic, grade level, and schedule compatibility, presented through a dedicated UI. | Not Yet Started | |
| 3 | Topic Request for Learners | Allows learners to submit a request specifying their desired topic, subject, and preferred schedule when no suitable tutor match is found. | Not Yet Started | |
| 4 | Topic Assessment for Tutor | Evaluates a tutor's subject knowledge for topics they intend to teach; tutors who pass are awarded a badge for that topic, supported by a question bank. | Not Yet Started | |
| 4 | Topic Assessment Request for Tutor | Notifies the admin when a tutor creates a class for a topic that has no existing assessment, prompting the admin to create one so all topics remain properly assessed. | Not Yet Started | |
| 4 | Pre- and Post-Test Engine for Classes | Requires tutors to publish pre- and post-session quizzes to measure student understanding and track learning progress. | Not Yet Started | |
| 4 | Learner Progress Report | Provides a before-and-after comparison of learner scores to visualize academic progress. | Not Yet Started | |
| 5 | Chatbot Assistant | Uses intent-based response logic (rule/pattern matching) to identify user requests, offering navigation help, FAQ support, class recommendations, and an interactive chat widget. | Not Yet Started | |
| 6 | Tutor Dashboard | Displays a tutor's classes, schedule, and other relevant account information in one view. | Not Yet Started | |
| 6 | Learner Dashboard | Displays a learner's classes, schedule, and other relevant account information in one view. | Not Yet Started | |
| 6 | Admin Dashboard | Presents platform-wide information such as total learners, tutors, and created classes, along with system status and usage statistics. | Not Yet Started | |
| 6 | User Management for Admin | Allows the admin to suspend a class or suspend/ban a tutor or learner account. | Not Yet Started | |
| 6 | Report Class, Report Tutor, Report Learner | Enables users to submit reports on classes, tutors, or learners, notifying the admin for review. | Not Yet Started | |
