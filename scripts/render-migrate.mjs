// Render free services run this before starting the app (no pre-deploy instance).
// Keep the database URL in memory and use the configured CA for strict MySQL TLS.
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const raw = process.env.DATABASE_URL;
if (!raw) throw new Error("DATABASE_URL is required for release migrations.");
const url = new URL(raw);
const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
let directory;
try {
  if (!local) {
    const configured = process.env.AIVEN_CA_CERT || process.env.DATABASE_CA_CERT || process.env.DB_CA_CERT;
    let certificate = configured?.replace(/\\n/g, "\n");
    if (certificate && !certificate.includes("BEGIN CERTIFICATE") && existsSync(certificate)) {
      certificate = readFileSync(certificate, "utf8");
    }
    if (certificate?.includes("BEGIN CERTIFICATE")) {
      directory = mkdtempSync(join(tmpdir(), "katuwang-migration-ca-"));
      const path = join(directory, "ca.pem");
      writeFileSync(path, certificate, { mode: 0o600 });
      url.searchParams.set("sslcert", path);
    }
    url.searchParams.delete("ssl-mode");
    url.searchParams.delete("sslmode");
    url.searchParams.set("sslaccept", "strict");
  }
  const cli = createRequire(import.meta.url).resolve("prisma/build/index.js");
  const result = spawnSync(process.execPath, [cli, "migrate", "deploy"], {
    stdio: ["inherit", "pipe", "inherit"],
    encoding: "utf8",
    env: { ...process.env, DATABASE_URL: url.toString() },
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
  // Verify this catalog replacement when applied, without blocking later legitimate admin edits on restart.
  if (process.exitCode === 0 && result.stdout?.includes("20261028010000_general_subject_grouping")) {
    const verified = spawnSync(process.execPath, [join(process.cwd(), "scripts/verify-curriculum.mjs")], { stdio: "inherit", env: process.env });
    if (verified.error) throw verified.error;
    process.exitCode = verified.status ?? 1;
  }
  if (process.exitCode === 0) {
    const seeded = spawnSync(process.execPath, [join(process.cwd(), "scripts/render-seed-test-data.mjs")], { stdio: "inherit", env: process.env });
    if (seeded.error) throw seeded.error;
    process.exitCode = seeded.status ?? 1;
  }
} finally {
  if (directory) rmSync(directory, { recursive: true, force: true });
}
