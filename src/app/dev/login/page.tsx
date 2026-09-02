import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DevLoginBoard, { type DevUser } from "@/components/dev/DevLoginBoard";

export const metadata = {
  title: "Dev Login | Katuwang",
};

// Dev-only quick login. All seeded accounts share the password below.
const DEV_PASSWORD = "password123";

export default async function DevLoginPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      anonymousId: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      status: true,
      gradeLevel: true,
      section: true,
    },
    orderBy: { anonymousId: "asc" },
  });

  const byRole = (role: DevUser["role"]) => users.filter((u) => u.role === role);

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="mx-auto max-w-8xl space-y-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-base-content">Dev Quick Login</h1>
          <p className="text-xs text-base-content/60">
            Click any account to sign in as them. Not available in production. Password used:{" "}
            <code className="rounded bg-base-300 px-1">{DEV_PASSWORD}</code>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <DevLoginBoard title="Tutors" tone="badge-primary" users={byRole("STUDENT_TUTOR")} password={DEV_PASSWORD} />
          <DevLoginBoard title="Learners" tone="badge-secondary" users={byRole("STUDENT_LEARNER")} password={DEV_PASSWORD} />
          <DevLoginBoard title="Admins" tone="badge-error" users={byRole("ADMIN")} password={DEV_PASSWORD} />
        </div>
      </div>
    </div>
  );
}
