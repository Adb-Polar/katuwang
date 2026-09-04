import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import { chatbotMessageSchema } from "@/lib/validations/chatbot";
import { getBotReply } from "@/lib/chatbot/respond";
import type { ChatContext } from "@/lib/chatbot/types";

// ─── POST: ask the intent-based assistant ────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
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

    const reply = await getBotReply(result.data.message, ctx);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Error handling chatbot message:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
