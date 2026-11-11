import { z } from "zod";
const grade = z.enum(["GRADE_7", "GRADE_8", "GRADE_9", "GRADE_10", "GRADE_11", "GRADE_12"]);
const officialUrl = z.string().url().refine((value) => {
  const url = new URL(value);
  return url.protocol === "https:" && (url.hostname === "deped.gov.ph" || url.hostname.endsWith(".deped.gov.ph"));
}, "An official DepEd HTTPS source is required.");
const evidence = z.object({
  status: z.enum(["verified-index", "verified-guide"]), note: z.string().min(20),
  reviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sources: z.array(z.object({ title: z.string().min(1), url: officialUrl })).min(1),
});
const topic = z.object({
  name: z.string().min(2).max(191), gradeLevels: z.array(grade).min(1),
  curriculum: evidence.extend({ associations: z.array(z.object({
    gradeLevel: grade, sourceUrl: officialUrl, curriculumVersion: z.string().min(1),
    track: z.string().nullable(), strand: z.string().nullable(), gradeEvidenceUrl: officialUrl,
    pdfPage: z.number().int().positive().optional(),
  })).min(1) }),
});
const catalogSchema = z.array(z.object({
  slug: z.string().regex(/^[A-Z][A-Z0-9_]{1,39}$/), name: z.string().min(2).max(191),
  gradeLevels: z.array(grade).min(1), order: z.number().int().nonnegative(),
  curriculum: evidence, topics: z.array(topic).min(1),
})).min(1);

/** Reject unsupported sources, duplicate topics, or grades without evidence before writing. */
export function validateCurriculumCatalog(input: unknown): void {
  const catalog = catalogSchema.parse(input);
  const subjects = new Set<string>(), names = new Set<string>();
  for (const subject of catalog) {
    if (subjects.has(subject.slug) || names.has(subject.name.toLocaleLowerCase())) throw new Error("Duplicate curriculum subject.");
    subjects.add(subject.slug); names.add(subject.name.toLocaleLowerCase());
    const topics = new Set<string>();
    for (const topic of subject.topics) {
      const key = topic.name.toLocaleLowerCase();
      if (topics.has(key)) throw new Error(`Duplicate curriculum topic: ${subject.slug}/${topic.name}`);
      topics.add(key);
      const grades = topic.gradeLevels, associations = topic.curriculum.associations;
      if (new Set(grades).size !== grades.length || associations.length !== grades.length ||
        new Set(associations.map((a) => a.gradeLevel)).size !== grades.length ||
        associations.some((a) => !grades.includes(a.gradeLevel)) || grades.some((g) => !subject.gradeLevels.includes(g))) {
        throw new Error(`Invalid grade evidence: ${subject.slug}/${topic.name}`);
      }
      for (const a of associations) {
        if (["GRADE_11", "GRADE_12"].includes(a.gradeLevel) && !a.track) throw new Error("SHS track evidence is required.");
        if (topic.curriculum.status === "verified-guide" && !a.pdfPage) throw new Error("Guide page evidence is required.");
      }
    }
  }
}
