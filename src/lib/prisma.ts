import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaClient: PrismaClient;

if (process.env.NODE_ENV === "production") {
  const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
  prismaClient = new PrismaClient({ adapter });
} else {
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
    globalForPrisma.prisma = new PrismaClient({
      adapter,
      log: ["query", "error"],
    });
  }
  prismaClient = globalForPrisma.prisma;
}

export const prisma = prismaClient;
export default prisma;
