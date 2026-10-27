import { describe, it, expect } from "vitest";
import { canViewProfilePicture, sanitizeAvatarForViewer } from "@/lib/avatarPrivacy";

describe("avatarPrivacy - canViewProfilePicture", () => {
  it("allows users to always view their own profile picture", () => {
    expect(canViewProfilePicture({ viewerRole: "STUDENT_LEARNER", targetRole: "STUDENT_LEARNER", isSelf: true })).toBe(true);
    expect(canViewProfilePicture({ viewerRole: "STUDENT_TUTOR", targetRole: "STUDENT_TUTOR", isSelf: true })).toBe(true);
    expect(canViewProfilePicture({ viewerRole: "ADMIN", targetRole: "ADMIN", isSelf: true })).toBe(true);
  });

  it("allows admins to view anyone's profile picture", () => {
    expect(canViewProfilePicture({ viewerRole: "ADMIN", targetRole: "STUDENT_LEARNER" })).toBe(true);
    expect(canViewProfilePicture({ viewerRole: "ADMIN", targetRole: "STUDENT_TUTOR" })).toBe(true);
    expect(canViewProfilePicture({ viewerRole: "ADMIN", targetRole: "ADMIN" })).toBe(true);
  });

  it("allows students to view tutors' profile pictures", () => {
    expect(canViewProfilePicture({ viewerRole: "STUDENT_LEARNER", targetRole: "STUDENT_TUTOR" })).toBe(true);
  });

  it("allows tutors to view students' profile pictures", () => {
    expect(canViewProfilePicture({ viewerRole: "STUDENT_TUTOR", targetRole: "STUDENT_LEARNER" })).toBe(true);
  });

  it("strictly prohibits students from viewing other students' profile pictures", () => {
    expect(canViewProfilePicture({ viewerRole: "STUDENT_LEARNER", targetRole: "STUDENT_LEARNER", isSelf: false })).toBe(false);
  });

  it("denies unauthenticated viewers from viewing profile pictures", () => {
    expect(canViewProfilePicture({ viewerRole: null, targetRole: "STUDENT_LEARNER" })).toBe(false);
    expect(canViewProfilePicture({ viewerRole: undefined, targetRole: "STUDENT_TUTOR" })).toBe(false);
  });
});

describe("avatarPrivacy - sanitizeAvatarForViewer", () => {
  const learnerA = { id: "learner-1", role: "STUDENT_LEARNER" as const, image: "https://utfs.io/f/pic1.jpg" };
  const learnerB = { id: "learner-2", role: "STUDENT_LEARNER" as const, image: "https://utfs.io/f/pic2.jpg" };
  const tutorA = { id: "tutor-1", role: "STUDENT_TUTOR" as const, image: "https://utfs.io/f/tutor1.jpg" };

  it("strips image when student views another student", () => {
    const result = sanitizeAvatarForViewer(learnerB, { id: learnerA.id, role: learnerA.role });
    expect(result.image).toBeNull();
  });

  it("preserves image when student views themselves", () => {
    const result = sanitizeAvatarForViewer(learnerA, { id: learnerA.id, role: learnerA.role });
    expect(result.image).toBe("https://utfs.io/f/pic1.jpg");
  });

  it("preserves image when student views tutor", () => {
    const result = sanitizeAvatarForViewer(tutorA, { id: learnerA.id, role: learnerA.role });
    expect(result.image).toBe("https://utfs.io/f/tutor1.jpg");
  });

  it("preserves image when tutor views student", () => {
    const result = sanitizeAvatarForViewer(learnerA, { id: tutorA.id, role: tutorA.role });
    expect(result.image).toBe("https://utfs.io/f/pic1.jpg");
  });

  it("preserves image when admin views student", () => {
    const result = sanitizeAvatarForViewer(learnerA, { id: "admin-1", role: "ADMIN" });
    expect(result.image).toBe("https://utfs.io/f/pic1.jpg");
  });
});
