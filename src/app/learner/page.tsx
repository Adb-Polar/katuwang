import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Learner Portal | Katuwang",
};

export default async function LearnerDashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "STUDENT_LEARNER") {
    redirect("/unauthorized");
  }

  return (
    <main className="min-h-screen bg-base-200 text-base-content font-sans p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight">Student Learner Portal</h1>
              <p className="text-xs text-base-content/60">
                Welcome back! Surfacing only anonymized data to protect your identity.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="badge badge-primary font-semibold py-3 px-3">
                ID: {session.user.anonymousId}
              </div>
              <div className="badge badge-neutral font-semibold py-3 px-3">
                Learner
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main area */}
          <div className="md:col-span-2 space-y-6">
            {/* Request session card */}
            <section className="card bg-base-100 shadow-md border border-base-200">
              <div className="card-body gap-4">
                <h2 className="card-title text-sm font-bold">Request a Tutoring Session</h2>
                <p className="text-xs text-base-content/70">
                  You can match with certified Student Tutors for Mathematics, Science, English, Filipino, and other subjects.
                </p>
                <div className="card-actions justify-start">
                  <button className="btn btn-primary btn-sm cursor-pointer text-xs">
                    Request Session
                  </button>
                </div>
              </div>
            </section>

            {/* Upcoming sessions card */}
            <section className="card bg-base-100 shadow-md border border-base-200">
              <div className="card-body gap-4">
                <h2 className="card-title text-sm font-bold">Upcoming Sessions</h2>
                <div className="alert alert-neutral py-4 text-xs text-center justify-center bg-base-200/50 border-base-350">
                  <span>No sessions scheduled. Request one above!</span>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Info card */}
            <section className="card bg-base-100 shadow-md border border-base-200">
              <div className="card-body gap-4">
                <h2 className="card-title text-sm font-bold">Account Info</h2>
                <div className="divider my-0"></div>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-base-200">
                    <span className="text-base-content/50">Real Name</span>
                    <span className="font-semibold">{session.user.fullName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-base-200">
                    <span className="text-base-content/50">Email</span>
                    <span className="font-semibold">{session.user.email}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-base-content/50">Role</span>
                    <span className="font-semibold text-primary">Student Learner</span>
                  </div>
                </div>
                <div className="card-actions pt-2 w-full">
                  <Link
                    href="/api/auth/signout"
                    className="btn btn-neutral btn-outline btn-sm w-full text-error hover:btn-error hover:text-white transition text-xs"
                  >
                    Log Out
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
