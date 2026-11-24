import { repairPersonName } from "@/lib/personName";

export const NAME_FIELDS = ["firstName", "lastName", "adviserTeacherName"] as const;
export type NameField = (typeof NAME_FIELDS)[number];
export type StoredNames = Record<NameField, string | null>;

export type NameCleanupPlan = {
  changes: Partial<Record<NameField, string>>;
  unfixable: NameField[];
};

/** Works out which of a user's stored names can be rewritten and which need manual review. */
export function planNameCleanup(names: StoredNames): NameCleanupPlan {
  const plan: NameCleanupPlan = { changes: {}, unfixable: [] };
  for (const field of NAME_FIELDS) {
    const stored = names[field];
    if (stored === null || stored === "") continue;
    const repaired = repairPersonName(stored);
    if (repaired === null) plan.unfixable.push(field);
    else if (repaired !== stored) plan.changes[field] = repaired;
  }
  return plan;
}
