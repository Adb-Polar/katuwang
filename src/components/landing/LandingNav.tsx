import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Logo from "./Logo";

export default function LandingNav({ signedIn }: { signedIn: boolean }) {
  return (
    <nav className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 py-5" aria-label="Primary">
      <Link href="/" className="flex items-center gap-2.5 font-sans font-heavy tracking-tight">
        <Logo className="w-8 h-8" />
        Katuwang
      </Link>

      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
        <Link href="#story" className="btn btn-ghost btn-sm text-xs hidden sm:inline-flex text-(--kt-muted)">
          How it works
        </Link>
        <Link href="/privacy-policy" className="btn btn-ghost btn-sm text-xs hidden sm:inline-flex text-(--kt-muted)">
          Privacy
        </Link>
        <ThemeToggle className="btn btn-ghost btn-sm btn-square hidden min-[360px]:inline-flex" />
        {signedIn ? (
          <Link href="/dashboard" className="btn btn-primary btn-sm text-xs">
            Go to your portal
          </Link>
        ) : (
          <>
            <Link href="/login" className="btn btn-ghost btn-sm text-xs px-2 sm:px-3">
              Log in
            </Link>
            <Link href="/register" className="btn btn-primary btn-sm text-xs px-2 sm:px-3">
              Create account
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
