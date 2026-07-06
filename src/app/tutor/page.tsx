import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Tutor Portal | Katuwang",
};

export default async function TutorDashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "STUDENT_TUTOR") {
    redirect("/unauthorized");
  }

  // Fetch tutor profile information from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      tutorProfile: {
        include: {
          appliedSubjects: true,
        },
      },
    },
  });

  const appliedSubjects = user?.tutorProfile?.appliedSubjects ?? [];
  const status = user?.tutorProfile?.status ?? "PENDING";

  return (
    <main className="min-h-screen bg-base-200 text-base-content font-sans p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight">Student Tutor Portal</h1>
              <p className="text-xs text-base-content/60">
                Manage your availability, certified subjects, and session schedules.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="badge badge-success text-white font-semibold py-3 px-3">
                ID: {session.user.anonymousId}
              </div>
              <div className="badge badge-neutral font-semibold py-3 px-3">
                Status: {status}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            {/* Subject Applications */}
            <section className="card bg-base-100 shadow-md border border-base-200">
              <div className="card-body gap-4">
                <h2 className="card-title text-sm font-bold">Applied Subjects & Certifications</h2>
                <p className="text-xs text-base-content/60">
                  You must pass the qualifying assessment for each subject before you can accept learner requests.
                </p>
                
                <div className="space-y-3 mt-1">
                  {appliedSubjects.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-3 border border-base-200 bg-base-200/20 rounded-xl text-xs"
                    >
                      <span className="font-semibold text-base-content/80">{app.subject}</span>
                      <div className="flex items-center gap-2">
                        {app.certified ? (
                          <div className="badge badge-success text-white text-[10px] font-bold py-2">
                            CERTIFIED
                          </div>
                        ) : (
                          <>
                            <div className="badge badge-warning text-white text-[10px] font-bold py-2">
                              PENDING EXAM
                            </div>
                            <button className="btn btn-neutral btn-xs cursor-pointer text-[10px] font-bold">
                              Take Exam
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Upcoming sessions */}
            <section className="card bg-base-100 shadow-md border border-base-200">
              <div className="card-body gap-4">
                <h2 className="card-title text-sm font-bold">Tutoring Matches</h2>
                <div className="alert alert-neutral py-4 text-xs text-center justify-center bg-base-200/50 border-base-350">
                  <span>Matches are locked until you are certified in at least one subject.</span>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account info */}
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
                    <span className="font-semibold text-success">Student Tutor</span>
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
