// Replaces the password of every seeded demo account (@katuwang.test / @dev.test)
// with a fresh random one, so the public default from SEED_ACCOUNTS.md stops
// working. Prints the new passwords once — store them somewhere safe.
//
//   pnpm exec tsx prisma/rotate-seed-passwords.ts            # dry run
//   pnpm exec tsx prisma/rotate-seed-passwords.ts --apply    # write
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { config as loadEnv } from "dotenv";

loadEnv();

const DEMO_DOMAINS = ["@katuwang.test", "@dev.test"];
const apply = process.argv.includes("--apply");
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL!) });

// Meets the app's password policy: upper, lower, digit, symbol, 16+ chars.
const newPassword = () => `Kt-${randomBytes(12).toString("base64url")}9a!`;

async function main() {
  const users = await prisma.user.findMany({
    where: { OR: DEMO_DOMAINS.map((d) => ({ email: { endsWith: d } })) },
    select: { id: true, email: true },
  });
  console.log(`${users.length} demo account(s) found${apply ? "" : " (dry run — pass --apply to write)"}.`);
  if (!apply) return;

  for (const u of users) {
    const password = newPassword();
    await prisma.user.update({
      where: { id: u.id },
      data: { password: await bcrypt.hash(password, 12) },
    });
    console.log(`${u.email}\t${password}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
