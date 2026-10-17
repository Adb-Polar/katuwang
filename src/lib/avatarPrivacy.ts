import { Role } from "@prisma/client";

export interface CanViewProfilePictureOptions {
  viewerRole?: Role | string | null;
  targetRole?: Role | string | null;
  isSelf?: boolean;
}

/**
 * Access control policy for profile picture visibility:
 * 1. Self: Users can always view their own profile picture.
 * 2. Admin: Administrators can view all user profile pictures.
 * 3. Student -> Tutor: Students (learners) are ALLOWED to view tutors' profile pictures.
 * 4. Tutor -> Student: Tutors are ALLOWED to view students' profile pictures.
 * 5. Student -> Student: Students are STRICTLY FORBIDDEN from viewing other students' profile pictures.
 * 6. Tutor -> Tutor: Tutors can view tutors' profile pictures.
 * 7. Default: Disallow viewing.
 */
export function canViewProfilePicture({
  viewerRole,
  targetRole,
  isSelf = false,
}: CanViewProfilePictureOptions): boolean {
  if (isSelf) {
    return true;
  }

  if (viewerRole === "ADMIN") {
    return true;
  }

  if (viewerRole === "STUDENT_LEARNER") {
    if (targetRole === "STUDENT_TUTOR") {
      return true;
    }
    // Student to student viewing is strictly prohibited
    if (targetRole === "STUDENT_LEARNER") {
      return false;
    }
    return false;
  }

  if (viewerRole === "STUDENT_TUTOR") {
    if (targetRole === "STUDENT_LEARNER") {
      return true;
    }
    if (targetRole === "STUDENT_TUTOR") {
      return true;
    }
    return false;
  }

  return false;
}

/**
 * Strips or preserves the `image` property based on whether the viewer has
 * permission to view the target user's profile picture.
 */
export function sanitizeAvatarForViewer<T extends { image?: string | null; role?: Role | string | null; id?: string }>(
  target: T,
  viewer: { id?: string | null; role?: Role | string | null } | null
): T {
  const isSelf = Boolean(viewer?.id && target.id && viewer.id === target.id);
  const allowed = canViewProfilePicture({
    viewerRole: viewer?.role,
    targetRole: target.role,
    isSelf,
  });

  if (!allowed) {
    return {
      ...target,
      image: null,
    };
  }

  return target;
}
