import Link from "next/link";
import Logo from "./Logo";

export default function LandingFooter() {
  return (
    <footer className="border-t border-base-300">
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-2xs text-(--kt-muted)">
        <span className="flex items-center gap-2"><Logo className="w-6 h-6" />Katuwang — academic match and support portal · TRIS, Legazpi City</span>
        <span>
          <Link href="/privacy-policy" className="hover:underline">
            Privacy Policy
          </Link>{" "}
          · RA 10173
        </span>
      </div>
    </footer>
  );
}
