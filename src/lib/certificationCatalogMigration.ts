import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import type { PrismaClient, TopicCertification, TopicCertificationStatus } from "@prisma/client";
import { lockTutorProfile } from "./classLocks";

export const CERTIFICATION_CATALOG_REVISION = "certification-catalog-2026-11-14-v1";
const key = (subject: string, topic: string) => JSON.stringify([subject, topic]);
const target = (subject: string, topic: string) => ({ subject, topic });
// Reviewed administrative correspondences for the previous grouped catalog.
// No mapping means archive the retired badge; a tutor selects a current topic
// and demonstrates that topic's competence instead of receiving a guessed badge.
export const CERTIFICATION_TOPIC_REPLACEMENTS: Record<string, { subject: string; topic: string }[]> = {
  [key("MISCELLANEOUS", "Welding")]: [target("TLE", "Industrial Arts Shielded Metal Arc Welding")],
  [key("MISCELLANEOUS", "Baking & Pastry")]: [target("TLE", "Home Economics Bread and Pastry Production")],
  [key("MISCELLANEOUS", "Cooking & Food Preparation")]: [target("TLE", "Home Economics Cookery")],
  [key("RESEARCH_DIGITAL_LITERACY", "Research Writing")]: [target("SSHS_RESEARCH_2", "Writing the Research Report")],
  [key("BUSINESS_ENTREPRENEURSHIP", "Entrepreneurship")]: [target("SSHS_ENTREPRENEURSHIP", "Nature of Entrepreneurship and Business Planning")],
  [key("VALUES_EDUCATION", "Isip, Kilos-Loob & Human Dignity")]: [target("JHS_EDUKASYON_PAGPAPAKATAO", "Ang Pagkatao ng Tao")],
  [key("FILIPINO", "Balarila")]: [target("FILIPINO", "Wika at Gramatika")],
  [key("FILIPINO", "Pagsulat ng Sanaysay")]: [target("FILIPINO", "Pagsulat")],
  [key("ENGLISH", "Grammar & Sentence Structure")]: [target("ENGLISH", "Grammar Awareness")],
  [key("MATH", "Whole Numbers & Operations")]: [target("MATH", "Numbers and Number Sense")],
  [key("MATH", "Fractions, Decimals & Rational Numbers")]: [target("MATH", "Numbers and Number Sense")],
  [key("MATH", "Algebraic Expressions & Factoring")]: [target("MATH", "Patterns and Algebra")],
  [key("MATH", "Linear Equations & Inequalities")]: [target("MATH", "Patterns and Algebra")],
  [key("MATH", "Geometry & Measurement")]: [target("MATH", "Geometry"), target("MATH", "Measurement")],
  [key("MAPEH", "East Asian Arts")]: [target("ARTS", "Arts of East Asia")],
  [key("MAPEH", "Adolescent Health")]: [target("HEALTH", "Growth and Development")],
  [key("MAPEH", "Fitness & Active Recreation")]: [target("PHYSICAL_EDUCATION", "Active Recreation")],
  [key("MAPEH", "Health Education")]: [target("HEALTH", "Personal Health")],
};
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const scope = (r: { tutorProfileId: string; subject: string; topic: string }) => JSON.stringify([r.tutorProfileId, r.subject, r.topic]);
export class CertificationCatalogError extends Error {
  constructor(message: string, readonly status = 409) { super(message); }
}
const effectiveStatus = (row: TopicCertification): TopicCertificationStatus => row.approvalMethod === "ASSESSMENT" && row.status === "CERTIFIED" ? "PENDING" : row.status;
const rank = (row: TopicCertification) => ({ CERTIFIED: 3, PENDING: 2, REJECTED: 1 })[effectiveStatus(row)];

/** Move retired certification assignments without rewriting qualification history. */
export async function migrateCertificationCatalog(db: PrismaClient, input: {
  adminId: string; operationId: string; reason: string; dryRun?: boolean; expectedFingerprint?: string;
}) {
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(input.operationId) || input.reason.trim().length < 20 || input.reason.length > 1000) throw new CertificationCatalogError("Provide a valid operation ID and substantive reason.", 400);
  const dryRun = input.dryRun !== false;
  return db.$transaction(async tx => {
    const actor = await tx.user.findFirst({ where: { id: input.adminId, role: "SUPER_ADMIN", status: "ACTIVE" }, select: { id: true } });
    if (!actor) throw new CertificationCatalogError("An active super administrator is required.", 403);
    const oldOperation = await tx.seedDataRebuild.findUnique({ where: { id: input.operationId }, select: { revision: true, summary: true } });
    if (oldOperation) {
      if (oldOperation.revision !== CERTIFICATION_CATALOG_REVISION) throw new CertificationCatalogError("Operation ID already belongs to another operation.");
      return { alreadyApplied: true, summary: oldOperation.summary };
    }
    const catalog = await tx.subject.findMany({ where: { active: true }, include: { topics: { where: { active: true }, orderBy: { id: "asc" } } }, orderBy: { id: "asc" } });
    if (!catalog.length || catalog.every(s => !s.topics.length)) throw new CertificationCatalogError("The active catalog is unavailable. No certifications were changed.", 503);
    const active = new Set(catalog.flatMap(s => s.topics.map(t => key(s.slug, t.name))));
    const rows = await tx.topicCertification.findMany({ orderBy: { id: "asc" } });
    const outdated = rows.filter(r => !active.has(key(r.subject, r.topic)));
    if (!dryRun) for (const id of [...new Set(outdated.map(r => r.tutorProfileId))].sort()) await lockTutorProfile(tx, id);
    const current = new Map(rows.filter(r => active.has(key(r.subject, r.topic))).map(r => [scope(r), r]));
    const groups = new Map<string, { subject: string; topic: string; tutorProfileId: string; sources: TopicCertification[] }>();
    for (const row of outdated) for (const replacement of CERTIFICATION_TOPIC_REPLACEMENTS[key(row.subject, row.topic)] ?? []) {
      if (!active.has(key(replacement.subject, replacement.topic))) throw new CertificationCatalogError(`Mapped topic ${replacement.subject} / ${replacement.topic} is not active. Review the catalog mapping first.`);
      const replacementKey = scope({ ...replacement, tutorProfileId: row.tutorProfileId });
      const group = groups.get(replacementKey) ?? { ...replacement, tutorProfileId: row.tutorProfileId, sources: [] };
      group.sources.push(row); groups.set(replacementKey, group);
    }
    const replacements = [...groups].map(([replacementKey, group]) => {
      const winner = [...group.sources].sort((a, b) => rank(b) - rank(a) || a.id.localeCompare(b.id))[0];
      return { ...group, winner, existing: current.get(replacementKey), status: current.get(replacementKey)?.status ?? effectiveStatus(winner),
        id: "c" + sha([CERTIFICATION_CATALOG_REVISION, replacementKey]).slice(0, 24) };
    });
    const fingerprint = sha([CERTIFICATION_CATALOG_REVISION, catalog, rows]);
    const plan = {
      revision: CERTIFICATION_CATALOG_REVISION, operationId: input.operationId, dryRun, fingerprint,
      totalCertifications: rows.length, outdatedRecords: outdated.length,
      certifiedOutdatedRecords: outdated.filter(r => r.status === "CERTIFIED").length,
      unaffectedCurrentRecords: current.size, replacementRecords: replacements.filter(r => !r.existing).length,
      certifiedReplacements: replacements.filter(r => !r.existing && r.status === "CERTIFIED").length,
      pendingReplacements: replacements.filter(r => !r.existing && r.status === "PENDING").length,
      existingTargetsPreserved: replacements.filter(r => r.existing).length,
      mergedSourceGroups: replacements.filter(r => r.sources.length > 1).length,
      archivedWithoutReplacement: outdated.filter(r => !CERTIFICATION_TOPIC_REPLACEMENTS[key(r.subject, r.topic)]?.length).length,
      mappings: [...new Map(outdated.map(r => [key(r.subject, r.topic), { previousSubject: r.subject, previousTopic: r.topic,
        replacements: CERTIFICATION_TOPIC_REPLACEMENTS[key(r.subject, r.topic)] ?? [],
        action: CERTIFICATION_TOPIC_REPLACEMENTS[key(r.subject, r.topic)]?.length ? "REPLACE_WITH_CURRENT_EQUIVALENT" : "ARCHIVE_REASSESS_CURRENT_TOPIC" }])).values()],
    };
    if (dryRun) return plan;
    if (!input.expectedFingerprint || input.expectedFingerprint !== fingerprint) throw new CertificationCatalogError("Certifications or catalog changed since the preview. Preview again before applying.");
    if (!outdated.length) return { ...plan, archivedRecords: 0, createdRecords: 0, remainingOutdatedRecords: 0 };
    const bytes = Buffer.from(JSON.stringify({ schemaVersion: 1, revision: CERTIFICATION_CATALOG_REVISION, capturedAt: new Date().toISOString(), tables: { topic_certifications: outdated }, mappings: plan.mappings }));
    const backupSha256 = createHash("sha256").update(bytes).digest("hex");
    await tx.seedDataRebuild.create({ data: { id: input.operationId, revision: CERTIFICATION_CATALOG_REVISION, adminId: input.adminId, reason: input.reason,
      backup: gzipSync(bytes), backupSha256, summary: {} } });
    for (const row of replacements) {
      if (row.existing) continue; // A current review or assessment result always wins.
      const winner = row.winner;
      const assessed = winner.approvalMethod === "ASSESSMENT";
      const note = `Catalog migration ${input.operationId}: ${row.sources.map(r => `${r.subject} / ${r.topic}`).join("; ")} -> ${row.subject} / ${row.topic}. ${assessed ? "The prior assessment remains historical; a current-topic assessment is required." : "Prior certification status carried forward under the owner-authorized catalog correspondence; no new assessment was recorded."}`;
      await tx.topicCertification.create({ data: {
        id: row.id, tutorProfileId: row.tutorProfileId, subject: row.subject, topic: row.topic, status: row.status,
        requestedAt: winner.requestedAt, certifiedAt: row.status === "CERTIFIED" ? winner.certifiedAt : null,
        reviewedAt: assessed ? null : winner.reviewedAt,
        reviewNote: [winner.reviewNote, note].filter(Boolean).join("\n\n"),
        approvalMethod: assessed ? null : winner.approvalMethod,
        approvalEvidence: assessed ? null : winner.approvalEvidence, qualifyingAttemptId: null,
      } });
    }
    await tx.topicCertification.deleteMany({ where: { id: { in: outdated.map(r => r.id) } } });
    for (const previous of outdated) await tx.auditLog.create({ data: {
      adminId: input.adminId, action: "CERTIFICATION_CATALOG_REPLACED", targetType: "CERTIFICATION", targetId: previous.id,
      reason: JSON.stringify({ operationId: input.operationId, reason: input.reason, previousSubject: previous.subject, previousTopic: previous.topic, previousStatus: previous.status,
        replacements: replacements.filter(r => r.sources.some(s => s.id === previous.id)).map(r => ({ id: r.existing?.id ?? r.id, subject: r.subject, topic: r.topic, status: r.status, preservedExisting: Boolean(r.existing) })),
        reassessmentRequired: !CERTIFICATION_TOPIC_REPLACEMENTS[key(previous.subject, previous.topic)]?.length || previous.approvalMethod === "ASSESSMENT", backupSha256 }),
    } });
    const remaining = await tx.topicCertification.findMany({ select: { subject: true, topic: true } });
    const remainingOutdatedRecords = remaining.filter(r => !active.has(key(r.subject, r.topic))).length;
    if (remainingOutdatedRecords) throw new CertificationCatalogError("Post-migration verification found retired assignments. The transaction was rolled back.");
    const result = { ...plan, archivedRecords: outdated.length, createdRecords: replacements.filter(r => !r.existing).length, remainingOutdatedRecords, totalCertificationsAfter: remaining.length, backupSha256 };
    await tx.seedDataRebuild.update({ where: { id: input.operationId }, data: { summary: JSON.parse(JSON.stringify(result)) } });
    return result;
  }, { isolationLevel: "Serializable", timeout: 120000, maxWait: 10000 });
}
