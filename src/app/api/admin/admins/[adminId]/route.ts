import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role, AccountStatus } from "@prisma/client";
import { requireSuperAdminSession } from "@/lib/permissions";
import { updateAdminStatusSchema } from "@/lib/validations/admin";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/auditLog";

// ─── GET: Fetch Single Admin Details (Super Admin only) ──────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ adminId: string }> }
) {
  const auth = await requireSuperAdminSession();
  if (!auth.authorized) return auth.response;

  try {
    const { adminId } = await params;

    const admin = await prisma.user.findFirst({
      where: {
        id: adminId,
        role: { in: [Role.ADMIN, Role.SUPER_ADMIN] },
      },
      select: {
        id: true,
        anonymousId: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        statusReason: true,
        statusUpdatedAt: true,
        createdAt: true,
        updatedAt: true,
        contactInfo: true,
        emailVerifiedAt: true,
      },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found." }, { status: 404 });
    }

    return NextResponse.json({ admin });
  } catch (error) {
    console.error("Error fetching admin details:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin details." },
      { status: 500 }
    );
  }
}

// ─── PATCH: Update Admin Status (Super Admin only) ───────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ adminId: string }> }
) {
  const auth = await requireSuperAdminSession();
  if (!auth.authorized) return auth.response;

  try {
    const { adminId } = await params;

    // Self-protection: A Super Admin cannot suspend their own active account
    if (adminId === auth.session.user.id) {
      return NextResponse.json(
        { error: "You cannot suspend or modify your own account status." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const result = updateAdminStatusSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid status update.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { status, reason } = result.data;

    const targetUser = await prisma.user.findFirst({
      where: {
        id: adminId,
        role: { in: [Role.ADMIN, Role.SUPER_ADMIN] },
      },
      select: { id: true, role: true, anonymousId: true, status: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Admin not found." }, { status: 404 });
    }

    if (targetUser.role === Role.SUPER_ADMIN) {
      return NextResponse.json(
        { error: "Cannot modify a Super Admin account." },
        { status: 403 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: adminId },
        data: {
          status: status as AccountStatus,
          statusReason: reason || null,
          statusUpdatedAt: new Date(),
        },
        select: {
          id: true,
          anonymousId: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          status: true,
          statusReason: true,
          statusUpdatedAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          adminId: auth.session.user.id,
          action: AUDIT_ACTIONS.ADMIN_STATUS_CHANGE,
          targetType: AUDIT_TARGET_TYPES.USER,
          targetId: user.id,
          reason: `Changed admin ${user.anonymousId} status to ${status}${
            reason ? `: ${reason}` : ""
          }`,
        },
      });

      return user;
    });

    return NextResponse.json({
      message: `Admin account status updated to ${status}.`,
      admin: updated,
    });
  } catch (error) {
    console.error("Error updating admin status:", error);
    return NextResponse.json(
      { error: "Failed to update admin status." },
      { status: 500 }
    );
  }
}
