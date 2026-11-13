import { isAdminRole } from "@/lib/permissions";
export function canReadCertificate(user: { id: string; role: string }, learnerId: string) {
  return isAdminRole(user.role) || (user.role === "STUDENT_LEARNER" && user.id === learnerId);
}
/** Explicit allow-list: PDFs, leases, and registered email addresses never enter list responses. */
export const certificateListSelect = {
  id: true, certificateNumber: true, learnerName: true, tutorName: true,
  subjectName: true, classId: true, classCode: true, completedAt: true, issuedAt: true,
  emailStatus: true, emailSentAt: true, attempts: true, lastError: true,
} as const;
