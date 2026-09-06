import Link from "next/link";
import { notFound } from "next/navigation";
import DevDataFactory from "@/components/dev/DevDataFactory";

export const metadata = {
  title: "Dev Tools | Katuwang",
};

export default function DevHomePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-base-content">Dev Data Factory</h1>
            <p className="text-xs text-base-content/60">
              Spawn throwaway users, classes, enrolments and class requests against the current database.
              Not available in production. All accounts use <code className="rounded bg-base-300 px-1">password123</code>{" "}
              and an <code className="rounded bg-base-300 px-1">@dev.test</code> email.
            </p>
          </div>
          <Link href="/dev/login" className="btn btn-outline btn-sm shrink-0">
            Quick Login →
          </Link>
        </div>

        <DevDataFactory />
      </div>
    </div>
  );
}
