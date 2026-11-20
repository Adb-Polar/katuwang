import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Dates must be YYYY-MM-DD.");

export const ADMIN_REPORT_SCOPES = ["overview", "users", "classes", "enrollments", "session-tests", "certifications", "audit-log"] as const;
export const TUTOR_REPORT_SCOPES = ["summary", "class"] as const;

export const reportQuerySchema = z.object({
  format: z.enum(["pdf", "csv"], { message: "Format must be pdf or csv." }),
  from: isoDate.optional(),
  to: isoDate.optional(),
  classId: z.string().trim().min(1).max(64).optional(),
  scope: z.string().trim().min(1).max(32).optional(),
});

export type ReportQueryInput = z.infer<typeof reportQuerySchema>;
