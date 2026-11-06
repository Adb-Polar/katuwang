import type { Prisma } from "@prisma/client";

export class ClassWriteError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

/** Shared serialization point for enrollments and class-capacity changes. */
export async function lockClassRow(tx: Prisma.TransactionClient, classId: string): Promise<void> {
  const rows = await tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM tutor_classes WHERE id = ${classId} FOR UPDATE`;
  if (rows.length === 0) throw new ClassWriteError("Class not found.", 404);
}
