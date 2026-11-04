import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getActiveServerSession } from "@/lib/serverSession";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitEnabled, clientIp, tooManyRequests } from "@/lib/rateLimit";
import { MINUTE_MS } from "@/lib/datetime";

export async function DELETE(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");
    if (origin && origin !== req.nextUrl.origin) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }
    const session = await getActiveServerSession();
    if (!session || !["STUDENT_LEARNER", "STUDENT_TUTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (rateLimitEnabled()) {
      const limited = rateLimit(`account-delete:${session.user.id}:${clientIp(req.headers)}`, 5, 15 * MINUTE_MS);
      if (!limited.ok) return tooManyRequests(limited.retryAfter);
    }
    const body = await req.json();
    if (body?.confirm !== "DELETE" || typeof body.password !== "string" || !body.password) {
      return NextResponse.json({ error: "Enter your password and type DELETE to confirm." }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, password: true, tutorProfile: { select: { id: true } } } });
    if (!user || !(await bcrypt.compare(body.password, user.password))) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 400 });
    }

    if (user.tutorProfile) {
      const [enrolledClasses, authoredQuestions] = await Promise.all([
        prisma.tutorClass.count({ where: { tutorProfileId: user.tutorProfile.id, enrollments: { some: {} } } }),
        prisma.assessmentQuestion.count({ where: { createdById: user.id } }),
      ]);
      if (enrolledClasses || authoredQuestions) {
        return NextResponse.json({ error: "Your tutor account has class or assessment records used by others. Contact an administrator to arrange deletion without losing their records." }, { status: 409 });
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.chatbotMiss.updateMany({ where: { userId: user.id }, data: { userId: null } });
      await tx.classAppeal.updateMany({ where: { reviewedById: user.id }, data: { reviewedById: null } });
      await tx.report.updateMany({ where: { reviewedById: user.id }, data: { reviewedById: null } });
      await tx.questionRequest.updateMany({ where: { resolvedById: user.id }, data: { resolvedById: null } });
      await tx.auditLog.deleteMany({ where: { adminId: user.id } });
      await tx.classRecommendation.deleteMany({ where: { adminId: user.id } });
      if (user.tutorProfile) {
        await tx.topicRequest.updateMany({ where: { directedTutorProfileId: user.tutorProfile.id }, data: { directedTutorProfileId: null } });
        const classes = await tx.tutorClass.findMany({ where: { tutorProfileId: user.tutorProfile.id }, select: { id: true } });
        await tx.topicRequest.updateMany({ where: { fulfilledClassId: { in: classes.map((item) => item.id) } }, data: { fulfilledClassId: null } });
        await tx.tutorProfile.delete({ where: { id: user.tutorProfile.id } });
      }
      await tx.user.delete({ where: { id: user.id } });
    });
    return NextResponse.json({ message: "Account deleted." });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json({ error: "Could not delete the account. Please contact an administrator." }, { status: 500 });
  }
}
