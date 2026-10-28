// One-time reset authorized for the dev-test service. Never runs on the production service.
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import mariadb from "mariadb";

if (process.env.RENDER_SERVICE_ID !== "srv-db9hg37avr4c73e3eaeg") {
  console.log("Automatic test-data reseed skipped outside katuwang-dev-test.");
} else {
  const revision = "20261028-general-groups-seed-v1";
  const key = "testDataSeedRevision";
  const url = new URL(process.env.DATABASE_URL);
  const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  let ca = process.env.AIVEN_CA_CERT || process.env.DATABASE_CA_CERT || process.env.DB_CA_CERT;
  ca = ca?.replace(/\\n/g, "\n");
  if (ca && !ca.includes("BEGIN CERTIFICATE") && existsSync(ca)) ca = readFileSync(ca, "utf8");
  const connection = await mariadb.createConnection({ host: url.hostname, port: Number(url.port || 3306),
    user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: decodeURIComponent(url.pathname.slice(1)),
    connectTimeout: 10000, ssl: local ? undefined : { ...(ca?.includes("BEGIN CERTIFICATE") ? { ca } : {}), rejectUnauthorized: true } });
  let locked = false;
  try {
    const lock = await connection.query("SELECT GET_LOCK('katuwang-grouped-test-seed', 60) AS acquired");
    if (Number(lock[0].acquired) !== 1) throw new Error("Could not acquire the test reseed lock.");
    locked = true;
    const current = await connection.query("SELECT value FROM platform_settings WHERE `key`=?", [key]);
    if (current[0]?.value === revision) {
      console.log(`Test-data seed already applied: ${revision}; existing test activity retained.`);
    } else {
      const admins = await connection.query("SELECT id,password FROM users WHERE role IN ('ADMIN','SUPER_ADMIN')");
      console.log(`Starting one-time grouped test-data reseed: ${revision}.`);
      const cli = createRequire(import.meta.url).resolve("tsx/cli");
      const result = spawnSync(process.execPath, [cli, join(process.cwd(), "prisma/seed.ts"), "--reset"], {
        stdio: "inherit", timeout: 600000,
        env: { ...process.env, SEED_QUESTIONS_PER_TOPIC: "15", SEED_TUTORS: "10", SEED_LEARNERS: "18", SEED_CLASSES: "20", SEED_TOPIC_REQUESTS: "15" },
      });
      if (result.error) throw result.error;
      if (result.status !== 0) throw new Error(`Grouped test seed failed with exit code ${result.status}.`);
      const after = await connection.query("SELECT id,password FROM users WHERE role IN ('ADMIN','SUPER_ADMIN')");
      if (admins.some((a) => !after.some((b) => b.id === a.id && b.password === a.password))) throw new Error("An administrator login was altered by the seed.");
      await connection.query("INSERT INTO platform_settings (`key`,value,updatedAt) VALUES (?,?,NOW(3)) ON DUPLICATE KEY UPDATE value=VALUES(value),updatedAt=NOW(3)", [key, revision]);
      console.log(`Grouped test-data reseed completed: ${revision}; ${admins.length} existing administrator logins preserved.`);
    }
  } finally {
    if (locked) await connection.query("SELECT RELEASE_LOCK('katuwang-grouped-test-seed')");
    await connection.end();
  }
}
