import { config as loadEnv } from "dotenv";
import { prisma } from "../src/lib/prisma";
import { NAME_FIELDS, planNameCleanup, type NameCleanupPlan } from "../src/lib/nameCleanup";

// Rewrites stored user names to the rules new registrations follow
// (src/lib/personName.ts): casing, whitespace, composed accents, no decorative
// combining marks. Dry run by default — nothing is written without --apply.
//
//   pnpm names:cleanup            preview the changes
//   pnpm names:cleanup --apply    write them
loadEnv();

type PlannedUser = { id: string; anonymousId: string; plan: NameCleanupPlan; stored: Record<string, string | null> };

async function planAllUsers(): Promise<PlannedUser[]> {
  const users = await prisma.user.findMany({
    select: { id: true, anonymousId: true, firstName: true, lastName: true, adviserTeacherName: true },
    orderBy: { anonymousId: "asc" },
  });
  return users.map(({ id, anonymousId, ...stored }) => ({ id, anonymousId, stored, plan: planNameCleanup(stored) }));
}

function printPlan(planned: PlannedUser[]) {
  for (const { anonymousId, plan, stored } of planned) {
    for (const field of NAME_FIELDS) {
      const next = plan.changes[field];
      if (next !== undefined) console.log(`${anonymousId}  ${field}: ${JSON.stringify(stored[field])} -> ${JSON.stringify(next)}`);
    }
    for (const field of plan.unfixable) {
      console.log(`${anonymousId}  ${field}: ${JSON.stringify(stored[field])} NEEDS MANUAL REVIEW (left unchanged)`);
    }
  }
}

async function main() {
  const apply = process.argv.includes("--apply");
  const planned = await planAllUsers();
  const toUpdate = planned.filter(({ plan }) => Object.keys(plan.changes).length > 0);
  const needReview = planned.filter(({ plan }) => plan.unfixable.length > 0);

  printPlan(planned);
  console.log(
    `\n${planned.length} users checked: ${toUpdate.length} to update, ${needReview.length} need manual review.`
  );

  if (!apply) {
    console.log("Dry run — nothing was written. Re-run with --apply to save these changes.");
    return;
  }

  await prisma.$transaction(
    toUpdate.map(({ id, plan }) => prisma.user.update({ where: { id }, data: plan.changes }))
  );
  console.log(`Updated ${toUpdate.length} users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
