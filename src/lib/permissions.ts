import { Role } from "@prisma/client";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Checks whether a role possesses administrative privileges (ADMIN or SUPER_ADMIN).
 */
export function isAdminRole(role?: string | null): boolean {
  return role === Role.ADMIN || role === Role.SUPER_ADMIN;
}

/**
 * Checks whether a role possesses exclusive Super Admin privileges.
 */
export function isSuperAdminRole(role?: string | null): boolean {
  return role === Role.SUPER_ADMIN;
}

export type AdminAuthResult =
  | { authorized: true; session: Session }
  | { authorized: false; response: NextResponse };

/**
 * Enforces that the incoming request is authenticated with an administrative role (ADMIN or SUPER_ADMIN).
 */
export async function requireAdminSession(): Promise<AdminAuthResult> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  if (!isAdminRole(session.user.role)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Forbidden. Administrative access required." },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, session };
}

/**
 * Enforces that the incoming request is authenticated with exclusive Super Admin privileges.
 */
export async function requireSuperAdminSession(): Promise<AdminAuthResult> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  if (!isSuperAdminRole(session.user.role)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Forbidden. Super Admin access required." },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, session };
}
