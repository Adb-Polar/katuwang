import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { moderateAvatarSchema } from "@/lib/validations/admin";
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/auditLog";
import { notify } from "@/lib/notifications";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

// ─── POST: Moderate User Profile Picture (Warn, Remove, Lock, Unlock) ────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { userId } = await params;

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        image: true,
        imageKey: true,
        profilePictureLocked: true,
        anonymousId: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (targetUser.role === "ADMIN") {
      return NextResponse.json({ error: "Cannot moderate an admin account." }, { status: 400 });
    }

    const body = await req.json();
    const result = moderateAvatarSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { action, reason } = result.data;
    const profileLink = targetUser.role === "STUDENT_TUTOR" ? "/tutor/profile" : "/learner/profile";

    if (action === "REMOVE" && targetUser.imageKey) {
      try {
        await utapi.deleteFiles(targetUser.imageKey);
      } catch (err) {
        console.error("Failed to delete avatar from UploadThing on admin removal:", err);
      }
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      let updated = targetUser;

      if (action === "REMOVE") {
        updated = await tx.user.update({
          where: { id: userId },
          data: {
            image: null,
            imageKey: null,
            profilePictureUpdatedAt: new Date(),
          },
          select: {
            id: true,
            role: true,
            image: true,
            imageKey: true,
            profilePictureLocked: true,
            anonymousId: true,
          },
        });

        await tx.auditLog.create({
          data: {
            adminId: session.user.id,
            action: AUDIT_ACTIONS.PROFILE_PICTURE_REMOVED,
            targetType: AUDIT_TARGET_TYPES.USER,
            targetId: userId,
            reason: reason || null,
          },
        });

        await notify(
          tx,
          userId,
          "PROFILE_PICTURE_REMOVED",
          reason
            ? `Your profile picture was removed by an administrator. Reason: ${reason}`
            : "Your profile picture was removed by an administrator for policy non-compliance.",
          profileLink
        );
      } else if (action === "WARN") {
        await tx.auditLog.create({
          data: {
            adminId: session.user.id,
            action: AUDIT_ACTIONS.PROFILE_PICTURE_WARNING,
            targetType: AUDIT_TARGET_TYPES.USER,
            targetId: userId,
            reason: reason || null,
          },
        });

        await notify(
          tx,
          userId,
          "PROFILE_PICTURE_WARNING",
          `Your profile picture received a moderation warning: ${reason}`,
          profileLink
        );
      } else if (action === "LOCK") {
        updated = await tx.user.update({
          where: { id: userId },
          data: {
            profilePictureLocked: true,
            profilePictureUpdatedAt: new Date(),
          },
          select: {
            id: true,
            role: true,
            image: true,
            imageKey: true,
            profilePictureLocked: true,
            anonymousId: true,
          },
        });

        await tx.auditLog.create({
          data: {
            adminId: session.user.id,
            action: AUDIT_ACTIONS.PROFILE_PICTURE_LOCKED,
            targetType: AUDIT_TARGET_TYPES.USER,
            targetId: userId,
            reason: reason || null,
          },
        });

        await notify(
          tx,
          userId,
          "PROFILE_PICTURE_LOCKED",
          reason
            ? `Your profile picture upload permission has been locked by an administrator. Reason: ${reason}`
            : "Your profile picture upload permission has been locked by an administrator.",
          profileLink
        );
      } else if (action === "UNLOCK") {
        updated = await tx.user.update({
          where: { id: userId },
          data: {
            profilePictureLocked: false,
            profilePictureUpdatedAt: new Date(),
          },
          select: {
            id: true,
            role: true,
            image: true,
            imageKey: true,
            profilePictureLocked: true,
            anonymousId: true,
          },
        });

        await tx.auditLog.create({
          data: {
            adminId: session.user.id,
            action: AUDIT_ACTIONS.PROFILE_PICTURE_UNLOCKED,
            targetType: AUDIT_TARGET_TYPES.USER,
            targetId: userId,
            reason: reason || null,
          },
        });

        await notify(
          tx,
          userId,
          "PROFILE_PICTURE_UNLOCKED",
          "Your profile picture upload permission has been restored by an administrator.",
          profileLink
        );
      }

      return updated;
    });

    return NextResponse.json({
      message: `Profile picture action ${action} completed successfully.`,
      user: {
        id: updatedUser.id,
        image: updatedUser.image,
        profilePictureLocked: updatedUser.profilePictureLocked,
      },
    });
  } catch (error) {
    console.error("Error performing avatar moderation action:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
