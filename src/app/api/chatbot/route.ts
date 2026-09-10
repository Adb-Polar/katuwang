import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import { chatbotMessageSchema } from "@/lib/validations/chatbot";
import { getBotReplyWithScore } from "@/lib/chatbot/respond";
import type { ChatContext } from "@/lib/chatbot/types";
import { rateLimit, rateLimitEnabled, tooManyRequests } from "@/lib/rateLimit";
import { MINUTE_MS } from "@/lib/datetime";

// ─── POST: ask the intent-based assistant ────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (rateLimitEnabled()) {
      const limited = rateLimit(`chatbot:user:${session.user.id}`, 20, MINUTE_MS);
      if (!limited.ok) return tooManyRequests(limited.retryAfter);
    }

    if (!(await getSetting("chatbotEnabled"))) {
      return NextResponse.json({ error: "The assistant is currently unavailable." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const result = chatbotMessageSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid input.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    // Grade level feeds the (learner) class-recommendation intent.
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { gradeLevel: true },
    });

    const ctx: ChatContext = {
      role: session.user.role,
      userId: session.user.id,
      gradeLevel: user?.gradeLevel ?? null,
    };

    const { reply, score } = await getBotReplyWithScore(result.data.message, ctx);
    return NextResponse.json({
      reply,
      // Dev-only, so tuning the KB from near-misses doesn't leak to end users.
      ...(process.env.NODE_ENV !== "production" ? { debugScore: score } : {}),
    });
  } catch (error) {
    console.error("Error handling chatbot message:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
