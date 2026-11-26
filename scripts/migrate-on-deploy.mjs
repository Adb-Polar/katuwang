// Applies pending Prisma migrations as the first step of `pnpm build`, on Render only.
//
// Render sets RENDER=true in its build environment. Everywhere else (a developer's
// machine, CI) this does nothing, so a local `pnpm build` can never migrate whatever
// database DATABASE_URL happens to point at.
//
// `prisma migrate deploy` applies committed migrations that the database has not
// recorded yet. It never resets data, and running it again is a no-op.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

if (process.env.RENDER !== "true") {
  console.log("[migrate-on-deploy] Skipping migrations (not a Render build).");
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error("[migrate-on-deploy] DATABASE_URL is not set. Add it to the Render service's environment.");
  process.exit(1);
}

console.log("[migrate-on-deploy] Applying pending migrations…");
// The project's own Prisma CLI, by path, so this works however the script is started.
const prismaCli = fileURLToPath(new URL("../node_modules/prisma/build/index.js", import.meta.url));
const result = spawnSync(process.execPath, [prismaCli, "migrate", "deploy"], { stdio: "inherit" });

if (result.status !== 0) {
  // A non-zero exit stops the build, so Render keeps the previous version live.
  console.error("[migrate-on-deploy] Migration failed. The build is stopped so the old version stays live.");
  process.exit(result.status ?? 1);
}
