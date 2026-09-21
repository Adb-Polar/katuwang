import Link from "next/link";
import Logo from "./Logo";

export default function LandingNav({ signedIn }: { signedIn: boolean }) {
  return (
    <nav className="max-w-6xl mx-auto flex items-center justify-between gap-4 px-6 py-5" aria-label="Primary">
      <Link href="/" className="flex items-center gap-2.5 font-sans font-heavy tracking-tight">
        <Logo className="w-8 h-8" />
        Katuwang
      </Link>

      <div className="flex items-center gap-1">
        <Link href="#story" className="btn btn-ghost btn-sm text-xs hidden sm:inline-flex text-(--kt-muted)">
          How it works
        </Link>
        <Link href="/privacy-policy" className="btn btn-ghost btn-sm text-xs hidden sm:inline-flex text-(--kt-muted)">
          Privacy
        </Link>
        {signedIn ? (
          <Link href="/dashboard" className="btn btn-primary btn-sm text-xs">
            Go to your portal
          </Link>
        ) : (
          <>
            <Link href="/login" className="btn btn-ghost btn-sm text-xs">
              Log in
            </Link>
            <Link href="/register" className="btn btn-primary btn-sm text-xs">
              Create account
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
