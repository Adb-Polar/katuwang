import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HOUR_MS } from "@/lib/datetime";
import { notifyMany } from "@/lib/notifications";
import { clientIp, rateLimit, rateLimitEnabled, tooManyRequests } from "@/lib/rateLimit";
import { withQueue } from "@/lib/requestQueue";
import { contactCategoryLabel, contactMessageSchema } from "@/lib/validations/contact";

const MAX_MESSAGES_PER_HOUR = 5;

// ─── POST: Send a message to the administrators ─────────────────────────────
// Public on purpose: the people who need it most are logged out, suspended or banned.
async function handlePost(req: NextRequest) {
  try {
    if (rateLimitEnabled()) {
      const limit = rateLimit(`contact:ip:${clientIp(req.headers)}`, MAX_MESSAGES_PER_HOUR, HOUR_MS);
      if (!limit.ok) return tooManyRequests(limit.retryAfter);
    }

    const body = await req.json().catch(() => null);
    const result = contactMessageSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg, fieldErrors: result.error.issues.map(({ path, message }) => ({ path, message })) }, { status: 400 });
    }

    const { name, email, category, message } = result.data;

    await prisma.$transaction(async (tx) => {
      await tx.contactMessage.create({ data: { name, email, category, message } });

      const admins = await tx.user.findMany({
        where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, status: "ACTIVE" },
        select: { id: true },
      });
      // No sender details in the notification text: it is only a pointer to the inbox.
      await notifyMany(
        tx,
        admins.map((a) => a.id),
        "CONTACT_MESSAGE_NEW",
        `New contact message: ${contactCategoryLabel(category)}.`,
        "/admin/contact-messages"
      );
    });

    return NextResponse.json(
      { message: "Your message was sent. An administrator will reply to the email address you gave." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving contact message:", error);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}

export const POST = withQueue("read", handlePost);
