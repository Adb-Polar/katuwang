import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Authoritative server boundary: never authorize from the JWT's cached account
 * state alone. Every call reads the current account; DB failures fail closed.
 * Suspended accounts (including expired suspensions) must sign in again so the
 * existing login flow can reinstate them. A role change requires a fresh login.
 */
export async function getActiveServerSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, status: true, gradeLevel: true, image: true },
  });
  if (!account || account.status !== "ACTIVE" || account.role !== session.user.role) {
    return null;
  }

  return {
    ...session,
    user: {
      ...session.user,
      role: account.role,
      status: account.status,
      gradeLevel: account.gradeLevel,
      image: account.image,
    },
  };
}
