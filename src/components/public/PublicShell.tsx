import Link from "next/link";
import type { ReactNode } from "react";
import { publicFontVariables } from "./fonts";
import "./public.css";

/**
 * Wrapper for every public page (landing, auth, privacy policy): the public DaisyUI theme,
 * IBM Plex, the shared header and footer. `headerEnd` fills the right side of the header.
 */
export default function PublicShell({ headerEnd, children }: { headerEnd?: ReactNode; children: ReactNode }) {
  return (
    <div data-theme="katuwang-public" className={`kt-public ${publicFontVariables}`}>
      <PublicHeader>{headerEnd}</PublicHeader>
      {children}
      <PublicFooter />
    </div>
  );
}

export function PublicHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="lp-header">
      <div className="lp-wrap">
        <Link href="/" className="lp-brand">
          <PublicLogo />
          Katuwang
        </Link>
        {children}
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-wrap">
        <span>Katuwang · Taysan Resettlement Integrated School, Legazpi City, Albay</span>
        <span className="flex flex-wrap gap-x-5 gap-y-1">
          <Link href="/contact">Contact an administrator</Link>
          <Link href="/privacy-policy">Privacy policy</Link>
        </span>
      </div>
    </footer>
  );
}

/** The Katuwang mark, drawn inline so it takes the public primary colour. */
function PublicLogo() {
  return (
    <svg className="lp-logo" viewBox="0 0 560 525" aria-hidden="true">
      <path d="M486.65 56.5554H277.884C277.884 158.117 193.249 242.752 73.3501 262.5C150.932 262.5 221.461 262.5 299.043 262.5C348.799 262.5 396.518 240.802 431.701 202.18C466.884 163.558 486.65 111.175 486.65 56.5554Z" />
      <path d="M486.65 468.445H277.884C277.884 366.883 193.249 282.248 73.3501 262.5C150.932 262.5 221.461 262.5 299.043 262.5C348.799 262.5 396.518 284.198 431.701 322.82C466.884 361.442 486.65 413.825 486.65 468.445Z" />
    </svg>
  );
}
