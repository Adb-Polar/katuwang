import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyMany } from "@/lib/notifications";
import { rateLimit, rateLimitEnabled, clientIp, tooManyRequests } from "@/lib/rateLimit";
import { HOUR_MS } from "@/lib/datetime";
import { createContactMessageSchema } from "@/lib/validations/contact";

const MESSAGES_PER_HOUR = 3;

// ─── POST: Send a message to the administrators ────────────────────────────
// Public on purpose: the people who most need it (not registered yet, awaiting
// approval, suspended or banned) cannot sign in. Throttled per IP instead.
export async function POST(req: NextRequest) {
  try {
    if (rateLimitEnabled()) {
      const limited = rateLimit(`contact:ip:${clientIp(req.headers)}`, MESSAGES_PER_HOUR, HOUR_MS);
      if (!limited.ok) return tooManyRequests(limited.retryAfter);
    }

    const result = createContactMessageSchema.safeParse(await req.json());
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }
    const { name, email, subject, message } = result.data;

    const session = await getServerSession(authOptions);

    await prisma.$transaction(async (tx) => {
      await tx.contactMessage.create({
        data: { name, email, subject, message, senderId: session?.user.id ?? null },
      });

      const admins = await tx.user.findMany({
        where: { role: "ADMIN", status: "ACTIVE" },
        select: { id: true },
      });
      await notifyMany(
        tx,
        admins.map((admin) => admin.id),
        "CONTACT_MESSAGE_NEW",
        `New message for the admins: ${subject}.`,
        "/admin/contact-messages"
      );
    });

    return NextResponse.json(
      { message: "Your message was sent. An administrator will reply to the email address you gave." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating contact message:", error);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}
