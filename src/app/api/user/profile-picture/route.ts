import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

// ─── GET: Fetch Current User's Profile Picture Info ──────────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        image: true,
        profilePictureLocked: true,
        profilePictureUpdatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching profile picture info:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

// ─── DELETE: User Self-Service Removal of Profile Picture ─────────────────────
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        imageKey: true,
        profilePictureLocked: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (user.profilePictureLocked) {
      return NextResponse.json(
        { error: "Profile picture editing has been locked by an administrator." },
        { status: 403 }
      );
    }

    if (user.imageKey) {
      try {
        await utapi.deleteFiles(user.imageKey);
      } catch (err) {
        console.error("Failed to delete avatar from UploadThing cloud storage:", err);
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        image: null,
        imageKey: null,
        profilePictureUpdatedAt: new Date(),
      },
    });

    return NextResponse.json({ message: "Profile picture removed successfully." });
  } catch (error) {
    console.error("Error removing profile picture:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
