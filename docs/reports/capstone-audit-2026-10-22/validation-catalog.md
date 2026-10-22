# Actual validation definitions

Copied from source as an audit reference, not a new specification. Compare transform order as well as limits.

## src/lib/validations/admin.ts

```typescript
import { z } from "zod";

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"], {
    message: "Invalid account status.",
  }),
  reason: z.string().trim().max(500, "Reason cannot exceed 500 characters.").optional().or(z.literal("")),
  durationDays: z.number().int().positive().max(365, "Duration cannot exceed 365 days.").optional(),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;

export const updateClassStatusSchema = z.object({
  status: z.enum(["SCHEDULED", "SUSPENDED", "BANNED"], {
    message: "Invalid class status.",
  }),
  reason: z.string().trim().max(500, "Reason cannot exceed 500 characters.").optional().or(z.literal("")),
  durationDays: z.number().int().positive().max(365, "Duration cannot exceed 365 days.").optional(),
});

export type UpdateClassStatusInput = z.infer<typeof updateClassStatusSchema>;

export const reviewCertificationSchema = z.object({
  status: z.enum(["CERTIFIED", "REJECTED"], {
    message: "Invalid certification decision.",
  }),
  reviewNote: z
    .string()
    .trim()
    .max(500, "Review note cannot exceed 500 characters.")
    .optional()
    .or(z.literal("")),
});

export type ReviewCertificationInput = z.infer<typeof reviewCertificationSchema>;

export const updatePlatformSettingSchema = z.object({
  key: z.enum(
    [
      "requireCertificationForClassCreation",
      "registrationOpen",
      "matchingEnabled",
      "showTutorRealNames",
      "requireRegistrationApproval",
      "requireEmailVerification",
      "autoCertifyOnAssessmentPass",
      "chatbotEnabled",
      "sessionTestsEnabled",
    ],
    { message: "Invalid setting key." }
  ),
  value: z.boolean({ message: "Value must be a boolean." }),
});

export type UpdatePlatformSettingInput = z.infer<typeof updatePlatformSettingSchema>;

export const moderateTopicRequestSchema = z.object({
  status: z.enum(["OPEN", "CANCELLED"], { message: "Invalid class request status." }),
  reason: z.string().trim().max(500, "Reason cannot exceed 500 characters.").optional().or(z.literal("")),
});

export type ModerateTopicRequestInput = z.infer<typeof moderateTopicRequestSchema>;

export const reviewRegistrationSchema = z.object({
  decision: z.enum(["APPROVE", "DECLINE"], { message: "Invalid decision." }),
  reason: z.string().trim().max(500, "Reason cannot exceed 500 characters.").optional().or(z.literal("")),
});

export type ReviewRegistrationInput = z.infer<typeof reviewRegistrationSchema>;

export const moderateAvatarSchema = z
  .object({
    action: z.enum(["WARN", "REMOVE", "LOCK", "UNLOCK"], {
      message: "Invalid avatar moderation action.",
    }),
    reason: z
      .string()
      .trim()
      .max(500, "Reason cannot exceed 500 characters.")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.action === "WARN") {
        return Boolean(data.reason && data.reason.trim().length > 0);
      }
      return true;
    },
    {
      message: "A warning reason is required.",
      path: ["reason"],
    }
  );

export type ModerateAvatarInput = z.infer<typeof moderateAvatarSchema>;

export const updateProfilePictureRequirementSchema = z.object({
  value: z.enum(["OPTIONAL", "TUTORS_ONLY", "ALL_USERS"], {
    message: "Invalid requirement option.",
  }),
});

export type UpdateProfilePictureRequirementInput = z.infer<
  typeof updateProfilePictureRequirementSchema
>;

export const createAdminAccountSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(50, "First name is too long."),
  lastName: z.string().trim().min(1, "Last name is required.").max(50, "Last name is too long."),
  email: z.string().trim().email("Enter a valid email address.").toLowerCase(),
  contactInfo: z.string().trim().max(100, "Contact info cannot exceed 100 characters.").optional().nullable(),
});

export type CreateAdminAccountInput = z.infer<typeof createAdminAccountSchema>;

export const updateAdminStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"], { message: "Invalid status for admin account." }),
  reason: z.string().trim().max(500, "Reason cannot exceed 500 characters.").optional().or(z.literal("")),
});

export type UpdateAdminStatusInput = z.infer<typeof updateAdminStatusSchema>;


```

## src/lib/validations/assessment.ts

```typescript
import { z } from "zod";
import { OPTION_COUNT_MAX, OPTION_COUNT_MIN } from "@/lib/assessmentConfig";

// ─── Question bank (admin) ───────────────────────────────────────────────────

export const optionInputSchema = z.object({
  text: z.string().trim().min(1, "Option text is required.").max(500, "Option text is too long."),
  isCorrect: z.boolean(),
});

export const createAssessmentQuestionSchema = z
  .object({
    subject: z.string().trim().min(1, "Subject is required."),
    topic: z.string().trim().min(1, "Topic is required."),
    prompt: z
      .string()
      .trim()
      .min(5, "Question prompt must be at least 5 characters.")
      .max(1000, "Question prompt cannot exceed 1000 characters."),
    explanation: z
      .string()
      .trim()
      .max(1000, "Explanation cannot exceed 1000 characters.")
      .optional()
      .or(z.literal("")),
    options: z
      .array(optionInputSchema)
      .min(OPTION_COUNT_MIN, `Provide at least ${OPTION_COUNT_MIN} options.`)
      .max(OPTION_COUNT_MAX, `Provide at most ${OPTION_COUNT_MAX} options.`),
  })
  .refine((d) => d.options.filter((o) => o.isCorrect).length === 1, {
    message: "Mark exactly one option correct.",
    path: ["options"],
  });

export type CreateAssessmentQuestionInput = z.infer<typeof createAssessmentQuestionSchema>;

// Full edit (pre-use) OR a lone `active` toggle (post-use). Route enforces which.
export const updateAssessmentQuestionSchema = z
  .object({
    prompt: z
      .string()
      .trim()
      .min(5, "Question prompt must be at least 5 characters.")
      .max(1000, "Question prompt cannot exceed 1000 characters.")
      .optional(),
    explanation: z
      .string()
      .trim()
      .max(1000, "Explanation cannot exceed 1000 characters.")
      .optional()
      .or(z.literal("")),
    options: z
      .array(optionInputSchema)
      .min(OPTION_COUNT_MIN, `Provide at least ${OPTION_COUNT_MIN} options.`)
      .max(OPTION_COUNT_MAX, `Provide at most ${OPTION_COUNT_MAX} options.`)
      .optional(),
    active: z.boolean().optional(),
  })
  .refine(
    (d) => d.options === undefined || d.options.filter((o) => o.isCorrect).length === 1,
    { message: "Mark exactly one option correct.", path: ["options"] }
  );

export type UpdateAssessmentQuestionInput = z.infer<typeof updateAssessmentQuestionSchema>;

// ─── Global assessment config (admin) ──────────────────────────────────────
// One platform-wide value per field; applies to every subject and topic.

export const updateGlobalAssessmentConfigSchema = z
  .object({
    questionCount: z.coerce.number().int().min(1, "At least 1 question.").max(50, "At most 50 questions.").optional(),
    passPercent: z.coerce.number().int().min(1, "Pass mark must be 1-100.").max(100, "Pass mark must be 1-100.").optional(),
    minBankSize: z.coerce.number().int().min(1, "At least 1.").max(200, "At most 200.").optional(),
  })
  .refine((d) => d.questionCount !== undefined || d.passPercent !== undefined || d.minBankSize !== undefined, {
    message: "Provide at least one setting to update.",
  });

export type UpdateGlobalAssessmentConfigInput = z.infer<typeof updateGlobalAssessmentConfigSchema>;

// ─── Taking an assessment (tutor) ───────────────────────────────────────────

export const startAssessmentSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required."),
  topic: z.string().trim().min(1, "Topic is required."),
});

export type StartAssessmentInput = z.infer<typeof startAssessmentSchema>;

export const submitAssessmentSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().trim().min(1, "Missing question id."),
        optionId: z.string().trim().min(1, "Missing option id."),
      })
    )
    .min(1, "Answer at least one question.")
    .max(50, "Too many answers."),
});

export type SubmitAssessmentInput = z.infer<typeof submitAssessmentSchema>;

// ─── Question requests ──────────────────────────────────────────────────────

export const requestQuestionsSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required."),
  topic: z.string().trim().min(1, "Topic is required."),
  note: z.string().trim().max(500, "Note cannot exceed 500 characters.").optional().or(z.literal("")),
});

export type RequestQuestionsInput = z.infer<typeof requestQuestionsSchema>;

export const resolveQuestionRequestSchema = z.object({
  status: z.enum(["RESOLVED", "DISMISSED"], { message: "Invalid decision." }),
  resolutionNote: z
    .string()
    .trim()
    .max(500, "Note cannot exceed 500 characters.")
    .optional()
    .or(z.literal("")),
});

export type ResolveQuestionRequestInput = z.infer<typeof resolveQuestionRequestSchema>;

```

## src/lib/validations/auth.ts

```typescript
import { z } from "zod";
import { GradeLevel } from "@prisma/client";
import { passwordField } from "@/lib/validations/password";

/**
 * Shared registration fields validation schema.
 */
export const commonRegisterSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required.")
    .max(50, "First name cannot exceed 50 characters.")
    .trim(),
  lastName: z
    .string()
    .min(1, "Last name is required.")
    .max(50, "Last name cannot exceed 50 characters.")
    .trim(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.string().email("Invalid email address.")),
  password: passwordField,
  recoveryEmail: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.string().email("Invalid recovery email address."))
    .optional()
    .or(z.literal("")),
  gradeLevel: z.nativeEnum(GradeLevel, {
    message: "Invalid grade level.",
  }),
  section: z.string().min(1, "Section is required.").trim(),
  contactInfo: z.string().trim().optional().or(z.literal("")),
  consentGiven: z.literal(true, {
    message: "Parent/guardian consent is required.",
  }),
});

/**
 * Learner registration validation schema.
 */
export const learnerRegisterSchema = commonRegisterSchema.extend({
  type: z.literal("LEARNER"),
});

/**
 * Tutor registration validation schema.
 */
export const tutorRegisterSchema = commonRegisterSchema.extend({
  type: z.literal("TUTOR"),
});

/**
 * Discriminated union schema for handling both types of registration.
 */
export const registerSchema = z.discriminatedUnion("type", [
  learnerRegisterSchema,
  tutorRegisterSchema,
]);

export type RegisterInput = z.infer<typeof registerSchema>;
export type LearnerRegisterInput = z.infer<typeof learnerRegisterSchema>;
export type TutorRegisterInput = z.infer<typeof tutorRegisterSchema>;

```

## src/lib/validations/availability.ts

```typescript
import { z } from "zod";

// Shared weekly time-slot shape. Tutor availability is no longer hand-entered
// (it's auto-derived from class sessions — see `src/lib/derivedAvailability.ts`),
// but this slot schema is still the canonical shape for a learner's preferred
// meeting windows in the matcher (`src/lib/validations/match.ts`).

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export const dayEnum = z.enum(DAYS, { message: "Invalid day of week." });

const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format (HH:MM).");

export const availabilitySlotSchema = z
  .object({
    day: dayEnum,
    startTime: timeString,
    endTime: timeString,
  })
  .refine((slot) => slot.startTime < slot.endTime, {
    message: "Start time must be before end time.",
    path: ["endTime"],
  });

export type DayOfWeek = z.infer<typeof dayEnum>;
export type AvailabilitySlotInput = z.infer<typeof availabilitySlotSchema>;

```

## src/lib/validations/changePassword.ts

```typescript
import { z } from "zod";
import { passwordField } from "@/lib/validations/password";

/** `POST /api/{role}/profile/password` — current + new password. */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: passwordField,
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

```

## src/lib/validations/chatbot.ts

```typescript
import { z } from "zod";

export const chatbotMessageSchema = z.object({
  message: z
    .string({ message: "Message is required." })
    .trim()
    .min(1, "Type a message first.")
    .max(500, "Message cannot exceed 500 characters."),
});

export type ChatbotMessageInput = z.infer<typeof chatbotMessageSchema>;

```

## src/lib/validations/class.ts

```typescript
import { z } from "zod";
import { SessionStatus, GradeLevel } from "@prisma/client";

// `subject` is a slug from the admin-managed taxonomy — routes verify it
// exists via src/lib/subjects.ts (`subjectExists` / `topicExists`).
const subjectSlug = z.string().trim().min(1, "Subject is required.");

export const sessionSchema = z.object({
  topic: z.string().trim().min(1, "Session topic is required."),
  scheduledAt: z.string().datetime({ message: "Invalid schedule date and time." }),
  duration: z.coerce
    .number()
    .int()
    .min(15, "Duration must be at least 15 minutes.")
    .max(240, "Duration cannot exceed 4 hours."),
});

export type SessionInput = z.infer<typeof sessionSchema>;

export const classDetailsSchema = z.object({
  subject: subjectSlug,
  gradeLevel: z
    .nativeEnum(GradeLevel, { message: "Invalid grade level." })
    .nullable()
    .optional(),
  topics: z
    .array(
      z
        .string()
        .trim()
        .min(2, "A topic needs at least 2 characters.")
        .max(60, "A topic cannot exceed 60 characters.")
    )
    .min(1, "Please select at least one topic.")
    .max(10, "You can select up to 10 topics."),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters.")
    .trim()
    .optional()
    .or(z.literal("")),
  maxStudents: z.coerce
    .number()
    .int()
    .min(1, "Capacity must be at least 1 student.")
    .max(10, "Capacity cannot exceed 10 students."),
  building: z
    .string()
    .max(100, "Building cannot exceed 100 characters.")
    .trim()
    .optional()
    .or(z.literal("")),
  room: z
    .string()
    .max(50, "Room cannot exceed 50 characters.")
    .trim()
    .optional()
    .or(z.literal("")),
  meetingLink: z
    .string()
    .trim()
    .url("Invalid URL format.")
    .optional()
    .or(z.literal("")),
  published: z.boolean().optional(),
});

export type ClassDetailsInput = z.infer<typeof classDetailsSchema>;

/** A class needs a way for learners to actually attend it — one of the two. */
export function hasLocationOrMeetingLink(d: { building?: string; room?: string; meetingLink?: string }) {
  return Boolean(d.building?.trim() || d.room?.trim() || d.meetingLink?.trim());
}

export const createClassSchema = classDetailsSchema
  .extend({
    sessions: z
      .array(sessionSchema)
      .min(1, "Please add at least one session.")
      .max(20, "You can add up to 20 sessions at once."),
  })
  .refine(hasLocationOrMeetingLink, {
    message: "Please provide a location (building/room) or a meeting link.",
    path: ["meetingLink"],
  });

export type CreateClassInput = z.infer<typeof createClassSchema>;

export const addSessionSchema = sessionSchema;

export type AddSessionInput = z.infer<typeof addSessionSchema>;

export const updateSessionSchema = sessionSchema.partial().extend({
  status: z.nativeEnum(SessionStatus, { message: "Invalid session status." }).optional(),
});

export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;

```

## src/lib/validations/classAppeal.ts

```typescript
import { z } from "zod";

// A tutor files an appeal against a suspended/banned class.
export const createClassAppealSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Please explain your appeal in at least 10 characters.")
    .max(500, "Appeal cannot exceed 500 characters."),
});

export type CreateClassAppealInput = z.infer<typeof createClassAppealSchema>;

// An admin reviews a pending appeal.
export const reviewClassAppealSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"], { message: "Invalid decision." }),
  reviewNote: z
    .string()
    .trim()
    .max(500, "Note cannot exceed 500 characters.")
    .optional()
    .or(z.literal("")),
});

export type ReviewClassAppealInput = z.infer<typeof reviewClassAppealSchema>;

```

## src/lib/validations/classRecommendation.ts

```typescript
import { z } from "zod";

/** `POST /api/admin/classes/[classId]/recommendations` — target learner + optional note. */
export const createClassRecommendationSchema = z.object({
  learnerId: z.string().min(1, "A learner is required."),
  note: z.string().trim().max(500, "Note cannot exceed 500 characters.").optional().or(z.literal("")),
});

export type CreateClassRecommendationInput = z.infer<typeof createClassRecommendationSchema>;

```

## src/lib/validations/emailVerification.ts

```typescript
import { z } from "zod";

/** `POST /api/auth/verify-email` — the emailed verification token. */
export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required."),
});

/** `POST /api/auth/resend-verification` — an account's login email. */
export const resendVerificationSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.string().email("Enter a valid email address.")),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

```

## src/lib/validations/match.ts

```typescript
import { z } from "zod";
import { GradeLevel } from "@prisma/client";
import { availabilitySlotSchema } from "@/lib/validations/availability";
import { createClassSchema } from "@/lib/validations/class";

// A learner's preferred meeting window — same shape/rules as a tutor availability slot.
export const preferredSlotSchema = availabilitySlotSchema;

// Shared criteria used by both the matcher and the topic-request create flow.
export const matchCriteriaSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required."),
  topics: z
    .array(z.string().trim().min(1, "Topic cannot be empty."))
    .min(1, "Please choose at least one topic.")
    .max(10, "You can choose up to 10 topics."),
  gradeLevel: z.nativeEnum(GradeLevel, { message: "Invalid grade level." }).optional(),
  preferredSlots: z
    .array(preferredSlotSchema)
    .max(21, "You can add up to 21 preferred time slots.")
    .optional(),
  // Auto Match only: "SOLO" = 1-on-1 (maxStudents 1), "GROUP" = maxStudents > 1.
  classFormat: z.enum(["SOLO", "GROUP", "ANY"]).optional(),
});

export type MatchCriteriaInput = z.infer<typeof matchCriteriaSchema>;

// Creating a persisted topic request: grade level is required, plus an optional note.
export const createTopicRequestSchema = matchCriteriaSchema.extend({
  gradeLevel: z.nativeEnum(GradeLevel, { message: "Invalid grade level." }),
  note: z
    .string()
    .max(500, "Note cannot exceed 500 characters.")
    .trim()
    .optional()
    .or(z.literal("")),
  // Present → the request is directed at one specific tutor; absent → public (every eligible tutor sees it).
  directedTutorId: z.string().trim().min(1, "Invalid tutor.").optional(),
});

export type CreateTopicRequestInput = z.infer<typeof createTopicRequestSchema>;

// The only status transition a learner may make on their own request.
export const cancelTopicRequestSchema = z.object({
  status: z.literal("CANCELLED"),
});

// A tutor accepting a request: the body IS a class-creation payload (the accept
// route auto-creates a full class from it).
export const acceptTopicRequestSchema = createClassSchema;

export type AcceptTopicRequestInput = z.infer<typeof acceptTopicRequestSchema>;

```

## src/lib/validations/password.ts

```typescript
import { z } from "zod";

// bcrypt silently truncates at 72 bytes, so anything longer is a footgun
// (two different passwords can hash equal). Cap it at the schema.
const BCRYPT_MAX_BYTES = 72;

// A short blocklist of the passwords that dominate every credential-stuffing
// list. Not a substitute for a breach-corpus check, just cheap low-hanging fruit.
const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "passw0rd",
  "12345678",
  "123456789",
  "1234567890",
  "11111111",
  "qwerty123",
  "qwertyuiop",
  "1q2w3e4r",
  "abcd1234",
  "iloveyou",
  "welcome1",
  "welcome123",
  "admin123",
  "letmein1",
  "changeme",
]);

/** Shared password rule for registration and password reset. */
export const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .refine((value) => Buffer.byteLength(value, "utf8") <= BCRYPT_MAX_BYTES, {
    message: "Password must be 72 bytes or fewer.",
  })
  .refine((value) => !COMMON_PASSWORDS.has(value.toLowerCase()), {
    message: "That password is too common. Choose something less predictable.",
  });

```

## src/lib/validations/passwordReset.ts

```typescript
import { z } from "zod";
import { passwordField } from "@/lib/validations/password";

/** `POST /api/auth/forgot-password` — an email address (primary or recovery). */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.string().email("Enter a valid email address.")),
});

/** `POST /api/auth/reset-password` — the emailed token plus the new password. */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required."),
  password: passwordField,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

```

## src/lib/validations/profile.ts

```typescript
import { z } from "zod";
import { GradeLevel } from "@prisma/client";

export { normalizeContactInfo } from "@/lib/contactInfo";

// ─── Self-service profile fields ─────────────────────────────────────────────
// Shared by tutors and learners. `gradeLevel` is editable by the account owner
// (see docs/reference/decisions.md — grade/section are self-service).
// `contactInfo` is only length-checked here; call `normalizeContactInfo` in the
// route for format validation + normalisation.
export const updateProfileSchema = z.object({
  contactInfo: z
    .string()
    .trim()
    .max(200, "Contact info cannot exceed 200 characters.")
    .optional()
    .or(z.literal("")),
  section: z.string().trim().min(1, "Section is required.").max(50, "Section cannot exceed 50 characters.").optional(),
  gradeLevel: z.nativeEnum(GradeLevel, { message: "Select a valid grade level." }).optional(),
  recoveryEmail: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.string().email("Invalid recovery email address."))
    .optional()
    .or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** @deprecated Use {@link updateProfileSchema}. Kept for existing imports. */
export const updateTutorProfileSchema = updateProfileSchema;
export type UpdateTutorProfileInput = UpdateProfileInput;

```

## src/lib/validations/report.ts

```typescript
import { z } from "zod";
import { ALL_VIOLATION_VALUES } from "@/lib/reportViolations";

const DETAILS_MAX = 1000;
const NOTE_MAX = 500;

// A learner files a report against a tutor or a class.
export const createReportSchema = z
  .object({
    targetType: z.enum(["TUTOR", "CLASS"], { message: "Invalid report target." }),
    // tutor report → the tutor's User id; class report → the TutorClass id
    targetId: z.string().trim().min(1, "Missing report target."),
    violations: z
      .array(z.enum(ALL_VIOLATION_VALUES))
      .min(1, "Select at least one reason.")
      .max(ALL_VIOLATION_VALUES.length, "Too many reasons selected."),
    details: z
      .string()
      .trim()
      .max(DETAILS_MAX, `Description cannot exceed ${DETAILS_MAX} characters.`)
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (d) => !d.violations.includes("OTHER") || (d.details?.trim().length ?? 0) >= 10,
    {
      message: "Describe the issue in at least 10 characters when you choose Other.",
      path: ["details"],
    }
  );

export type CreateReportInput = z.infer<typeof createReportSchema>;

// An admin resolves or dismisses a pending report.
export const reviewReportSchema = z.object({
  decision: z.enum(["RESOLVE", "DISMISS"], { message: "Invalid decision." }),
  resolutionNote: z
    .string()
    .trim()
    .max(NOTE_MAX, `Note cannot exceed ${NOTE_MAX} characters.`)
    .optional()
    .or(z.literal("")),
});

export type ReviewReportInput = z.infer<typeof reviewReportSchema>;

```

## src/lib/validations/sessionTest.ts

```typescript
import { z } from "zod";
import { optionInputSchema } from "@/lib/validations/assessment";
import { OPTION_COUNT_MAX, OPTION_COUNT_MIN } from "@/lib/assessmentConfig";

// One test per ClassSession, served twice (PRE then POST) — so `kind` is NOT a
// field here; it lives on the attempt. See docs/plans/assessments.md.

export const createSessionTestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters.")
    .max(120, "Title cannot exceed 120 characters."),
  instructions: z
    .string()
    .trim()
    .max(2000, "Instructions cannot exceed 2000 characters.")
    .optional()
    .or(z.literal("")),
});

export type CreateSessionTestInput = z.infer<typeof createSessionTestSchema>;

export const updateSessionTestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters.")
    .max(120, "Title cannot exceed 120 characters.")
    .optional(),
  instructions: z
    .string()
    .trim()
    .max(2000, "Instructions cannot exceed 2000 characters.")
    .optional()
    .or(z.literal("")),
});

export type UpdateSessionTestInput = z.infer<typeof updateSessionTestSchema>;

export const setSessionTestQuestionsSchema = z.object({
  // Array order is the on-test display order, shared by both runs.
  questionIds: z
    .array(z.string().trim().min(1, "Missing question id."))
    .min(1, "A test needs at least one question.")
    .max(50, "A test can have at most 50 questions."),
});

export type SetSessionTestQuestionsInput = z.infer<typeof setSessionTestQuestionsSchema>;

export const sessionTestStatusSchema = z.object({
  status: z.enum(["PUBLISHED", "CLOSED"], { message: "Invalid status transition." }),
});

export type SessionTestStatusInput = z.infer<typeof sessionTestStatusSchema>;

// A tutor authoring a custom question. `subject` is taken from the class; the
// route checks `topic` is one of the class's topics.
export const authorTutorQuestionSchema = z
  .object({
    classId: z.string().trim().min(1, "Missing class id."),
    topic: z.string().trim().min(1, "Topic is required."),
    prompt: z
      .string()
      .trim()
      .min(5, "Question prompt must be at least 5 characters.")
      .max(1000, "Question prompt cannot exceed 1000 characters."),
    explanation: z
      .string()
      .trim()
      .max(1000, "Explanation cannot exceed 1000 characters.")
      .optional()
      .or(z.literal("")),
    options: z
      .array(optionInputSchema)
      .min(OPTION_COUNT_MIN, `Provide at least ${OPTION_COUNT_MIN} options.`)
      .max(OPTION_COUNT_MAX, `Provide at most ${OPTION_COUNT_MAX} options.`),
  })
  .refine((d) => d.options.filter((o) => o.isCorrect).length === 1, {
    message: "Mark exactly one option correct.",
    path: ["options"],
  });

export type AuthorTutorQuestionInput = z.infer<typeof authorTutorQuestionSchema>;

export const updateTutorQuestionSchema = z
  .object({
    topic: z.string().trim().min(1).optional(),
    prompt: z.string().trim().min(5).max(1000).optional(),
    explanation: z.string().trim().max(1000).optional().or(z.literal("")),
    options: z
      .array(optionInputSchema)
      .min(OPTION_COUNT_MIN)
      .max(OPTION_COUNT_MAX)
      .optional(),
  })
  .refine(
    (d) => d.options === undefined || d.options.filter((o) => o.isCorrect).length === 1,
    { message: "Mark exactly one option correct.", path: ["options"] }
  );

export type UpdateTutorQuestionInput = z.infer<typeof updateTutorQuestionSchema>;

```

## src/lib/validations/subject.ts

```typescript
import { z } from "zod";

const name = z.string().trim().min(2, "Name must be at least 2 characters.").max(80, "Name is too long.");

// slug: uppercase snake, used as the stored `subject` value — immutable after creation.
const slug = z
  .string()
  .trim()
  .min(2, "Slug must be at least 2 characters.")
  .max(40, "Slug is too long.")
  .regex(/^[A-Z][A-Z0-9_]*$/, "Slug must be UPPER_SNAKE_CASE (letters, digits, underscores).");

export const createSubjectSchema = z.object({ name, slug });
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;

export const updateSubjectSchema = z
  .object({
    name: name.optional(),
    order: z.number().int().min(0).max(999).optional(),
    active: z.boolean().optional(),
  })
  .refine((v) => v.name !== undefined || v.order !== undefined || v.active !== undefined, {
    message: "Nothing to update.",
  });
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;

export const createTopicSchema = z.object({ name });
export type CreateTopicInput = z.infer<typeof createTopicSchema>;

export const updateTopicSchema = z
  .object({
    name: name.optional(),
    order: z.number().int().min(0).max(999).optional(),
    active: z.boolean().optional(),
  })
  .refine((v) => v.name !== undefined || v.order !== undefined || v.active !== undefined, {
    message: "Nothing to update.",
  });
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;

```

## src/lib/validations/topicCertification.ts

```typescript
import { z } from "zod";

export const requestTopicCertificationSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required."),
  topic: z.string().trim().min(1, "Topic is required."),
});

export type RequestTopicCertificationInput = z.infer<typeof requestTopicCertificationSchema>;

```
