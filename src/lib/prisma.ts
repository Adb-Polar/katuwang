import "dotenv/config";
import fs from "node:fs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import type { PoolConfig } from "mariadb";

/**
 * Retrieves the trusted CA certificate (e.g. Aiven Project CA).
 *
 * Checks in order:
 * 1. Environment variable contents (AIVEN_CA_CERT, DATABASE_CA_CERT, DB_CA_CERT, CA_CERT)
 *    supporting both real newlines and escaped `\n` characters.
 * 2. File path provided in environment variables (AIVEN_CA_CERT, AIVEN_CA_CERT_PATH, DATABASE_CA_CERT_PATH).
 * 3. Default Render Secret File mount paths (/etc/secrets/aiven-ca.pem, /etc/secrets/ca.pem).
 */
function readCertFile(filePath: string): string | undefined {
  try {
    if (fs.existsSync(/*turbopackIgnore: true*/ filePath)) {
      return fs.readFileSync(/*turbopackIgnore: true*/ filePath, "utf8");
    }
  } catch (err) {
    console.error("[Prisma] Failed to read CA certificate from path:", err);
  }
  return undefined;
}

export function getCaCertificate(env: Record<string, string | undefined> = process.env): string | undefined {
  const envCert =
    env.AIVEN_CA_CERT ||
    env.DATABASE_CA_CERT ||
    env.DB_CA_CERT ||
    env.CA_CERT;

  if (envCert) {
    const trimmed = envCert.trim();
    if (trimmed.includes("BEGIN CERTIFICATE")) {
      return trimmed.replace(/\\n/g, "\n");
    }
    // Check if the environment variable itself holds a file path
    const fromPath = readCertFile(trimmed);
    if (fromPath) return fromPath;
  }

  const pathEnv =
    env.AIVEN_CA_CERT_PATH ||
    env.DATABASE_CA_CERT_PATH ||
    env.DB_CA_CERT_PATH;

  if (pathEnv) {
    const fromPathEnv = readCertFile(pathEnv);
    if (fromPathEnv) return fromPathEnv;
  }

  // Common Render Secret File default mount locations
  const defaultSecretPaths = [
    "/etc/secrets/aiven-ca.pem",
    "/etc/secrets/ca.pem",
    "/etc/secrets/AIVEN_CA_CERT",
  ];
  for (const secretPath of defaultSecretPaths) {
    const fromSecret = readCertFile(secretPath);
    if (fromSecret) return fromSecret;
  }

  return undefined;
}

/**
 * Normalizes the database connection URL string for backwards compatibility and simple connections.
 */
export function getDatabaseUrl(rawUrl = process.env.DATABASE_URL): string {
  if (!rawUrl) {
    return "";
  }

  try {
    const url = new URL(rawUrl);

    const rawSslMode = url.searchParams.get("ssl-mode") || url.searchParams.get("sslmode");
    const sslMode = rawSslMode?.toLowerCase();
    const isExplicitlyDisabled = sslMode === "disable" || sslMode === "disabled" || url.searchParams.get("ssl") === "false";
    const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const isRemote = !isLocal;
    const isExplicitlyEnabled = sslMode === "required" || sslMode === "verify_ca" || sslMode === "verify_identity" || url.searchParams.get("ssl") === "true";

    // Enable TLS for remote cloud databases or when ssl-mode is explicitly requested, unless explicitly disabled
    const enableTls = !isExplicitlyDisabled && (isExplicitlyEnabled || isRemote || (process.env.NODE_ENV === "production" && !isLocal));

    if (enableTls && !url.searchParams.has("ssl")) {
      url.searchParams.set("ssl", "true");
    }

    // Allow public key retrieval for MySQL 8 caching_sha2_password authentication
    if (!url.searchParams.has("allowPublicKeyRetrieval")) {
      url.searchParams.set("allowPublicKeyRetrieval", "true");
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
}

/**
 * Parses a database connection URL into connection options.
 */
export function parseDatabaseUrl(rawUrl: string): {
  host: string;
  port: number;
  user?: string;
  password?: string;
  database: string;
  connectTimeout?: number;
  connectionLimit?: number;
} {
  const url = new URL(rawUrl);
  return {
    host: url.hostname,
    port: url.port ? parseInt(url.port, 10) : 3306,
    user: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    connectTimeout: url.searchParams.has("connectTimeout")
      ? parseInt(url.searchParams.get("connectTimeout")!, 10)
      : url.searchParams.has("connect_timeout")
        ? parseInt(url.searchParams.get("connect_timeout")!, 10) * 1000
        : undefined,
    connectionLimit: url.searchParams.has("connectionLimit")
      ? parseInt(url.searchParams.get("connectionLimit")!, 10)
      : undefined,
  };
}

/**
 * Builds the database driver configuration.
 *
 * When connecting to a remote/Aiven database:
 * - Uses TLS with certificate verification (`rejectUnauthorized: true`).
 * - Injects the CA certificate if provided via `AIVEN_CA_CERT` or secret file.
 * - If the CA certificate is missing in production for an Aiven host, logs an explicit diagnostic warning.
 */
export function getDatabaseConfig(
  rawUrl = process.env.DATABASE_URL,
  env: Record<string, string | undefined> = process.env
): PoolConfig | string {
  if (!rawUrl) {
    return "";
  }

  const caCert = getCaCertificate(env);

  try {
    const url = new URL(rawUrl);
    const rawSslMode = url.searchParams.get("ssl-mode") || url.searchParams.get("sslmode");
    const sslMode = rawSslMode?.toLowerCase();
    const isExplicitlyDisabled = sslMode === "disable" || sslMode === "disabled" || url.searchParams.get("ssl") === "false";
    const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const isRemote = !isLocal;
    const isAiven = url.hostname.includes("aivencloud.com");
    const isExplicitlyEnabled = sslMode === "required" || sslMode === "verify_ca" || sslMode === "verify_identity" || url.searchParams.get("ssl") === "true";

    // TLS is needed for remote cloud databases or when explicitly requested, unless explicitly disabled.
    // Local development databases do not require TLS unless explicitly configured.
    const needsTls = !isExplicitlyDisabled && (isExplicitlyEnabled || isRemote || (env.NODE_ENV === "production" && !isLocal));

    // Handle missing certificate configuration explicitly and safely in production
    if (!caCert && isAiven && env.NODE_ENV === "production") {
      console.warn(
        "[Prisma] Warning: Aiven CA certificate not found in environment variables (AIVEN_CA_CERT) or secret file (/etc/secrets/aiven-ca.pem). TLS certificate validation remains strictly enforced (rejectUnauthorized: true). If the connection fails with 'self-signed certificate in certificate chain', configure your Aiven Project CA."
      );
    }

    // Only inject TLS/SSL PoolConfig if TLS is actually required for this host.
    // Prevents applying remote/Aiven CA certificates to local development instances.
    if (needsTls) {
      const parsed = parseDatabaseUrl(rawUrl);
      const poolConfig: PoolConfig = {
        host: parsed.host,
        port: parsed.port,
        user: parsed.user,
        password: parsed.password,
        database: parsed.database,
        allowPublicKeyRetrieval: true,
        connectTimeout: parsed.connectTimeout ?? 30000,
        connectionLimit: parsed.connectionLimit,
        ssl: caCert
          ? {
              ca: caCert,
              rejectUnauthorized: true,
            }
          : {
              rejectUnauthorized: true,
            },
      };

      return poolConfig;
    }

    return getDatabaseUrl(rawUrl);
  } catch {
    return getDatabaseUrl(rawUrl);
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const config = getDatabaseConfig();
  const adapter = new PrismaMariaDb(config);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  });
}

// Reuse a single Prisma client instance across hot reloads and module evaluations
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "test") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
