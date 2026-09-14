import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validations/changePassword";
import { changeOwnPassword } from "@/lib/changePassword";

// ─── POST: Change Own Password ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const result = changePasswordSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid inputs.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { currentPassword, newPassword } = result.data;
    const outcome = await changeOwnPassword(session.user.id, currentPassword, newPassword);

    if (!outcome.ok) {
      const message =
        outcome.code === "WRONG_CURRENT_PASSWORD"
          ? "Current password is incorrect."
          : "Unauthorized.";
      return NextResponse.json({ error: message }, { status: 401 });
    }

    return NextResponse.json({ message: "Password updated." });
  } catch (error) {
    console.error("Error changing admin password:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
