import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Admin Dashboard | Katuwang",
};

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <main className="min-h-screen bg-base-200 text-base-content font-sans p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body flex-row justify-between items-center p-6">
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-xs text-base-content/60">
                Manage system configurations, user logs, and moderator accounts.
              </p>
            </div>
            <span className="badge badge-error text-white font-semibold py-3 px-3">
              Admin
            </span>
          </div>
        </header>

        <section className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body gap-4 p-6">
            <h2 className="card-title text-sm font-bold">Admin Privileges</h2>
            <p className="text-xs text-base-content/70">
              Welcome, {session.user.fullName}. You have full access to create moderators and view overall matching statistics.
            </p>
            <div className="card-actions pt-2">
              <Link
                href="/api/auth/signout"
                className="btn btn-neutral btn-outline btn-sm text-error hover:btn-error hover:text-white transition text-xs"
              >
                Log Out
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
