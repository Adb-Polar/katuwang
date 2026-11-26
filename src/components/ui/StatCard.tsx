import Link from "next/link";

/** One headline number in a card. With `href` the whole card links to the list behind the number. */
export default function StatCard({ label, value, hint, href }: {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
}) {
  const body = (
    <>
      <span className="text-sm text-(--kt-muted)">{label}</span>
      <span className="font-serif text-3xl font-medium tabular-nums leading-tight">{value}</span>
      {hint && <span className="text-sm text-(--kt-muted)">{hint}</span>}
    </>
  );
  const className = "kt-card flex! flex-col gap-1 px-5 py-4";
  return href ? (
    <Link href={href} className={`${className} hover:border-primary transition-colors`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
