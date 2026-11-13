// Run the HTTP server and durable certificate poller under one supervisor.
// A separate Render worker can use certificates:process instead when provisioned.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const workerEnv = { ...process.env };
if (workerEnv.DATABASE_URL) {
  const url = new URL(workerEnv.DATABASE_URL);
  url.searchParams.set("connectionLimit", "2");
  workerEnv.DATABASE_URL = url.toString();
}
const commands = [
  { name: "web", args: [require.resolve("next/dist/bin/next"), "start"], env: process.env },
  { name: "certificates", args: [require.resolve("tsx/cli"), "scripts/process-certificates.ts"], env: workerEnv },
];
let stopping = false;
let failed = false;
const children = commands.map(({ name, args, env }) => {
  const child = spawn(process.execPath, args, { stdio: "inherit", env });
  child.on("error", error => { console.error(`[render-start] ${name} failed to start: ${error.code ?? "unknown"}`); shutdown(true); });
  child.on("exit", (code, signal) => {
    if (!stopping) { console.error(`[render-start] ${name} exited (${code ?? signal}); restarting the service is required.`); shutdown(true); }
  });
  return child;
});
let forceTimer;
function shutdown(isFailure = false) {
  failed ||= isFailure;
  if (stopping) return;
  stopping = true;
  for (const child of children) if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
  forceTimer = setTimeout(() => { for (const child of children) if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL"); }, 25_000);
  forceTimer.unref();
}
process.on("SIGTERM", () => shutdown());
process.on("SIGINT", () => shutdown());
await Promise.all(children.map(child => new Promise(resolve => { child.once("exit", resolve); child.once("error", resolve); })));
clearTimeout(forceTimer);
process.exitCode = failed ? 1 : 0;
