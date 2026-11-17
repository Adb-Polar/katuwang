import type { ReactNode } from "react";

/** Heading for auth pages: a small Tagalog kicker, a serif title, and one line of help. */
export default function AuthHeading({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="lp-auth-head">
      <p className="lp-kicker" lang="fil">
        {kicker}
      </p>
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </div>
  );
}
