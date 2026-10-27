#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "..", ".env");

function safeParseUrl(rawUrl) {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    return {
      protocol: url.protocol.replace(/:$/, ""),
      host: url.hostname,
      port: url.port ? parseInt(url.port, 10) : 3306,
      database: url.pathname.replace(/^\//, ""),
      user: url.username || "anonymous",
      ssl: url.searchParams.get("ssl") || url.searchParams.get("ssl-mode") || url.searchParams.get("sslmode") || (url.hostname !== "localhost" && url.hostname !== "127.0.0.1" ? "enabled" : "none"),
      connectTimeout: url.searchParams.get("connectTimeout") || "default",
    };
  } catch {
    return null;
  }
}

function parseEnv(content) {
  const vars = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx !== -1) {
      const key = line.slice(0, eqIdx).trim();
      let val = line.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      vars[key] = val;
    }
  }
  return vars;
}

function displayTarget(rawUrl, label = "Active Database") {
  const info = safeParseUrl(rawUrl);
  if (!info) {
    console.log(`[Database Target] ${label}: Not configured or invalid URL.`);
    return;
  }

  const isLocal = info.host === "localhost" || info.host === "127.0.0.1";
  const targetType = isLocal ? "Local (MySQL/MariaDB)" : "Cloud (Aiven MySQL 8)";

  console.log(`\n======================================================`);
  console.log(`  ${label}`);
  console.log(`======================================================`);
  console.log(`  Target Type:     ${targetType}`);
  console.log(`  Host:            ${info.host}`);
  console.log(`  Port:            ${info.port}`);
  console.log(`  Database:        ${info.database}`);
  console.log(`  Username:        ${info.user}`);
  console.log(`  SSL / TLS:       ${info.ssl}`);
  console.log(`  Connect Timeout: ${info.connectTimeout}ms`);
  console.log(`======================================================\n`);
}

function main() {
  const action = (process.argv[2] || "target").toLowerCase();

  if (!fs.existsSync(envPath)) {
    console.error(`[Error] .env file not found at ${envPath}`);
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, "utf8");
  const envVars = parseEnv(envContent);

  if (action === "target" || action === "status" || action === "current") {
    displayTarget(envVars.DATABASE_URL, "Current Active Target");
    return;
  }

  let newUrl = "";
  let targetName = "";

  if (action === "local") {
    newUrl = envVars.LOCAL_DATABASE_URL;
    targetName = "Local Database";
    if (!newUrl) {
      console.error("[Error] LOCAL_DATABASE_URL is not set in .env");
      process.exit(1);
    }
  } else if (action === "cloud" || action === "aiven" || action === "prod") {
    newUrl = envVars.CLOUD_DATABASE_URL;
    targetName = "Cloud Database (Aiven)";
    if (!newUrl) {
      console.error("[Error] CLOUD_DATABASE_URL is not set in .env");
      process.exit(1);
    }
  } else {
    console.log("Usage: node scripts/switch-db.mjs [local | cloud | target]");
    console.log("  local  - Switch DATABASE_URL to LOCAL_DATABASE_URL");
    console.log("  cloud  - Switch DATABASE_URL to CLOUD_DATABASE_URL");
    console.log("  target - Safely display current active database configuration");
    process.exit(1);
  }

  // Update DATABASE_URL in .env while preserving everything else
  const lines = envContent.split("\n");
  let replaced = false;
  const updatedLines = lines.map((line) => {
    if (line.startsWith("DATABASE_URL=") || line.startsWith('DATABASE_URL =')) {
      replaced = true;
      return `DATABASE_URL="${newUrl}"`;
    }
    return line;
  });

  if (!replaced) {
    updatedLines.unshift(`DATABASE_URL="${newUrl}"`);
  }

  fs.writeFileSync(envPath, updatedLines.join("\n"), "utf8");
  console.log(`\n✔ Switched active DATABASE_URL to ${targetName}.`);
  displayTarget(newUrl, "Updated Active Target");
}

main();
