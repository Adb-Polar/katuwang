import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

/**
 * Normalizes the database connection URL for the MariaDB driver adapter.
 *
 * 1. Ensures TLS is enabled for remote databases (like Aiven) and when ssl-mode is set,
 *    mapping `ssl-mode=REQUIRED` to the driver-supported `ssl=true`. In Node.js,
 *    `ssl: true` preserves certificate validation (`rejectUnauthorized: true`).
 * 2. Configures `allowPublicKeyRetrieval=true` so that MySQL 8+ `caching_sha2_password`
 *    authentication handshake succeeds when RSA key exchange is required.
 */
export function getDatabaseUrl(rawUrl = process.env.DATABASE_URL): string {
  if (!rawUrl) {
    return "";
  }

  try {
    const url = new URL(rawUrl);

    const sslMode = url.searchParams.get("ssl-mode") || url.searchParams.get("sslmode");
    const isRemote = url.hostname !== "localhost" && url.hostname !== "127.0.0.1";

    // Enable TLS for remote cloud databases or when ssl-mode is specified
    if ((sslMode || isRemote || process.env.NODE_ENV === "production") && !url.searchParams.has("ssl")) {
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

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionUrl = getDatabaseUrl();
  const adapter = new PrismaMariaDb(connectionUrl);

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
