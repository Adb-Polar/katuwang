import "dotenv/config";
import { setTimeout } from "node:timers/promises";
import { processCertificateJobs } from "../src/lib/certificates/jobs";
import { prisma } from "../src/lib/prisma";
const once = process.argv.includes("--once");
let stopping = false;
process.on("SIGTERM", () => { stopping = true; });
process.on("SIGINT", () => { stopping = true; });
async function run() {
  try {
    do {
      try { console.info("[certificates]", await processCertificateJobs(10)); }
      catch { console.error("[certificates] Processing failed; durable jobs will be retried."); if (once) process.exitCode = 1; }
      if (!once && !stopping) await setTimeout(15_000);
    } while (!once && !stopping);
  } finally { await prisma.$disconnect(); }
}
void run().catch(() => { console.error("[certificates] Worker stopped unexpectedly."); process.exitCode = 1; });
