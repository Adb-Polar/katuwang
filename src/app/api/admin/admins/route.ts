import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role, GradeLevel, AccountStatus } from "@prisma/client";
import { requireSuperAdminSession } from "@/lib/permissions";
import { createAdminAccountSchema } from "@/lib/validations/admin";
import { generateAnonymousId } from "@/lib/idGenerator";
import { generateResetToken, hashResetToken } from "@/lib/passwordReset";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/auditLog";
import { sendMail } from "@/lib/mail";

import { parseSort } from "@/lib/sortParams";
import { ADMIN_PAGE_SIZE } from "@/lib/pagination";

const ADMIN_SORT_COLUMN: Record<
  string,
  "createdAt" | "lastName" | "status" | "role" | "anonymousId"
> = {
  createdAt: "createdAt",
  name: "lastName",
  status: "status",
  role: "role",
  code: "anonymousId",
};

// ─── GET: List all Administrative Accounts (Super Admin only) ────────────────
export async function GET(req?: NextRequest) {
  const auth = await requireSuperAdminSession();
  if (!auth.authorized) return auth.response;

  try {
    const url = req?.url ? new URL(req.url) : null;
    const searchParams = url ? url.searchParams : new URLSearchParams();
    const q = searchParams.get("q")?.trim() || "";
    const roleParam = searchParams.get("role");
    const statusParam = searchParams.get("status");
    const pageParam = searchParams.get("page");
    const pageSizeParam = searchParams.get("pageSize");

    const roleFilter =
      roleParam && (roleParam === "ADMIN" || roleParam === "SUPER_ADMIN")
        ? (roleParam as Role)
        : { in: [Role.ADMIN, Role.SUPER_ADMIN] };

    const statusFilter =
      statusParam && (statusParam === "ACTIVE" || statusParam === "SUSPENDED")
        ? (statusParam as AccountStatus)
        : undefined;

    const where = {
      role: roleFilter,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(q
        ? {
            OR: [
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { email: { contains: q } },
              { anonymousId: { contains: q } },
            ],
          }
        : {}),
    };

    const isPaginated = !!(pageParam || pageSizeParam || q || roleParam || statusParam);
    const page = Math.max(1, Number(pageParam) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(pageSizeParam) || ADMIN_PAGE_SIZE));
    const { sort, dir } = parseSort(searchParams, Object.keys(ADMIN_SORT_COLUMN), "createdAt");

    const [admins, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
        orderBy: isPaginated
          ? { [ADMIN_SORT_COLUMN[sort]]: dir }
          : [{ role: "asc" }, { createdAt: "asc" }],
        ...(isPaginated ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
      }),
      typeof prisma.user.count === "function" ? prisma.user.count({ where }) : Promise.resolve(0),
    ]);

    let superAdminCount = admins.filter((a) => a.role === Role.SUPER_ADMIN).length;
    let standardAdminCount = admins.filter((a) => a.role === Role.ADMIN).length;

    if (typeof prisma.user.count === "function") {
      const [sCount, aCount] = await Promise.all([
        prisma.user.count({ where: { role: Role.SUPER_ADMIN } }),
        prisma.user.count({ where: { role: Role.ADMIN } }),
      ]);
      superAdminCount = sCount;
      standardAdminCount = aCount;
    }

    const totalAll = superAdminCount + standardAdminCount;

    return NextResponse.json({
      admins,
      total: isPaginated ? (typeof prisma.user.count === "function" ? total : admins.length) : admins.length,
      page,
      pageSize,
      counts: {
        total: totalAll,
        superAdmins: superAdminCount,
        admins: standardAdminCount,
      },
    });
  } catch (error) {
    console.error("Error fetching admin accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin accounts." },
      { status: 500 }
    );
  }
}

// ─── POST: Provision New Admin Account (Super Admin only) ────────────────────
export async function POST(req: NextRequest) {
  const auth = await requireSuperAdminSession();
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const result = createAdminAccountSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid input data.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const data = result.data;

    // Check for duplicate account across email and recoveryEmail
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { recoveryEmail: data.email }],
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    // Generate next sequential ADM-xxxx anonymous ID
    const anonymousId = await generateAnonymousId("ADMIN");

    // Secure invitation token (valid for 48 hours)
    const rawToken = generateResetToken();
    const tokenHash = hashResetToken(rawToken);

    // Initial unguessable random password (cannot be used until activated)
    const randomPassword = crypto.randomUUID() + crypto.randomBytes(16).toString("hex");
    const initialHashedPassword = await bcrypt.hash(randomPassword, 12);

    const newAdmin = await prisma.$transaction(async (tx) => {
      // 1. Create the admin user
      const created = await tx.user.create({
        data: {
          anonymousId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: initialHashedPassword,
          role: Role.ADMIN, // Server-enforced Role.ADMIN — client cannot elevate
          gradeLevel: GradeLevel.GRADE_12,
          section: "ADMIN",
          contactInfo: data.contactInfo || null,
          consentGiven: true,
          status: AccountStatus.ACTIVE,
          emailVerifiedAt: new Date(),
        },
        select: {
          id: true,
          anonymousId: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          contactInfo: true,
        },
      });

      // 2. Issue activation token
      await tx.passwordResetToken.create({
        data: {
          userId: created.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h
        },
      });

      // 3. Write immutable audit log entry
      await tx.auditLog.create({
        data: {
          adminId: auth.session.user.id,
          action: AUDIT_ACTIONS.ADMIN_CREATED,
          targetType: AUDIT_TARGET_TYPES.USER,
          targetId: created.id,
          reason: `Created new admin account ${created.anonymousId} (${created.email})`,
        },
      });

      return created;
    });

    // Construct activation URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const activationUrl = `${baseUrl}/reset-password?token=${rawToken}`;

    // Dispatch invitation email if mailer is configured
    try {
      await sendMail({
        to: newAdmin.email,
        subject: "Welcome to Katuwang — Set up your administrator account",
        text: `Hello ${newAdmin.firstName},\n\nYou have been invited to join Katuwang as an Administrator.\nPlease set your password using this link (valid for 48 hours):\n${activationUrl}\n\nBest regards,\nKatuwang Platform Administration`,
        html: `<p>Hello ${newAdmin.firstName},</p><p>You have been invited to join Katuwang as an Administrator.</p><p><a href="${activationUrl}">Click here to set your password and activate your account</a> (valid for 48 hours).</p><p>Best regards,<br/>Katuwang Platform Administration</p>`,
      });
    } catch (mailErr) {
      console.warn("Could not dispatch invitation email:", mailErr);
    }

    return NextResponse.json(
      {
        message: "Admin account created successfully.",
        admin: newAdmin,
        activationUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating admin account:", error);
    return NextResponse.json(
      { error: "Failed to create admin account." },
      { status: 500 }
    );
  }
}
