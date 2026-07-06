import Link from "next/link";

export const metadata = {
  title: "Access Denied | Katuwang",
  description: "You do not have permission to view this page.",
};

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-base-200 p-4">
      <div className="card bg-base-100 max-w-md w-full shadow-2xl border border-base-200">
        <div className="card-body gap-5 text-center items-center p-8">
          <div className="w-16 h-16 rounded-full bg-error/15 text-error flex items-center justify-center">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-base-content">Access Denied</h1>
          <p className="text-xs text-base-content/60 leading-relaxed">
            You do not have the required permissions to access this page. Please make sure you are logged into the correct account.
          </p>
          <div className="card-actions pt-2 w-full">
            <Link
              href="/dashboard"
              className="btn btn-neutral btn-sm w-full cursor-pointer text-xs"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
