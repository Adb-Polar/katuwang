import type { Prisma } from "@prisma/client";

export class ClassWriteError extends Error {
  constructor(message: string, readonly status: number, readonly fieldErrors?: { path: (string | number)[]; message: string }[]) { super(message); }
}

/** Shared serialization point for enrollments and class-capacity changes. */
export async function lockClassRow(tx: Prisma.TransactionClient, classId: string): Promise<void> {
  const rows = await tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM tutor_classes WHERE id = ${classId} FOR UPDATE`;
  if (rows.length === 0) throw new ClassWriteError("Class not found.", 404);
}

/** Serialize changes that must agree on the current tutor profile state. */
export async function lockTutorProfile(tx: Prisma.TransactionClient, tutorProfileId: string): Promise<void> {
  const rows = await tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM tutor_profiles WHERE id = ${tutorProfileId} FOR UPDATE`;
  if (rows.length === 0) throw new ClassWriteError("Tutor profile not found.", 404);
}

/** All scheduling writers share the tutor-profile serialization point. */
export const lockTutorSchedule = lockTutorProfile;
