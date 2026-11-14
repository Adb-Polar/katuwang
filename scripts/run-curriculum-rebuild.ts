import { prisma } from "../src/lib/prisma";
import { rebuildCurriculumData } from "../prisma/rebuildCurriculumData";
import { verifySeedData } from "../prisma/verifySeedData";

async function main() {
  const args = process.argv.slice(2), values: Record<string, string> = {};
  let apply = false;
  for (let i = 0; i < args.length; i++) {
    const name = args[i];
    if (name === "--apply") { apply = true; continue; }
    if (name === "--dry-run") continue;
    if (!["--operation-id", "--admin-email", "--reason"].includes(name) || !args[i + 1] || args[i + 1].startsWith("--")) throw Error(`Invalid argument: ${name}`);
    values[name] = args[++i];
  }
  if (!values["--operation-id"] || !values["--admin-email"] || !values["--reason"]) throw Error("Usage: pnpm seed:rebuild [--apply] --operation-id unique-id --admin-email existing-super-admin --reason 'Owner-authorized seeded curriculum replacement'");
  const actor = await prisma.user.findUnique({ where: { email: values["--admin-email"] }, select: { id: true } });
  if (!actor) throw Error("The specified super administrator does not exist.");
  const input = { adminId: actor.id, operationId: values["--operation-id"], reason: values["--reason"] };
  const plan = await rebuildCurriculumData(prisma, input);
  console.log("KATUWANG_CURRICULUM_REBUILD_PLAN", JSON.stringify(plan));
  if (apply) {
    const result = await rebuildCurriculumData(prisma, { ...input, apply: true, expectedFingerprint: "fingerprint" in plan ? plan.fingerprint : undefined });
    console.log("KATUWANG_CURRICULUM_REBUILD_RESULT", JSON.stringify(result));
    console.log("KATUWANG_CURRICULUM_REBUILD_VERIFIED", JSON.stringify(await verifySeedData(prisma, 20)));
  }
}
main().catch(error => {
  // Never log connection strings, query arguments, backup content, or passwords.
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : undefined;
  console.error("KATUWANG_CURRICULUM_REBUILD_FAILED", error instanceof Error && error.constructor.name === "SeedRebuildError" ? error.message : code ?? "Rebuild stopped. Inspect the recorded operation before retrying; the replacement transaction is atomic.");
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
