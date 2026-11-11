import type { CatalogSubject } from "@/hooks/useSubjectCatalog";

/** Curriculum identity helps users choose a course that matches their school. */
export default function CatalogCurriculumHint({ subject }: { subject?: CatalogSubject }) {
  const value = subject?.curriculum;
  if (!value || typeof value !== "object") return null;
  const evidence = value as { status?: string; track?: string; cluster?: string };
  if (evidence.status === "verified-index") return <p className="text-xs text-base-content/60">Legacy K to 12 curriculum domains. Check your school&apos;s curriculum.</p>;
  if (evidence.status === "verified-guide") return <p className="text-xs text-base-content/60">Strengthened SHS · {evidence.track}{evidence.cluster ? ` · ${evidence.cluster}` : ""}</p>;
  return null;
}
