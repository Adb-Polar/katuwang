import { prisma } from "../src/lib/prisma";
import { Role } from "@prisma/client";

async function main() {
  const args = process.argv.slice(2);
  const email = args[0]?.trim().toLowerCase();
  const force = args.includes("--force");

  if (!email || email.startsWith("--")) {
    console.error("Usage: pnpm exec tsx scripts/promote-super-admin.ts <email> [--force]");
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { recoveryEmail: email }],
    },
    select: {
      id: true,
      email: true,
      anonymousId: true,
      role: true,
      firstName: true,
      lastName: true,
    },
  });

  if (!user) {
    console.error(`Error: No user found with email "${email}".`);
    process.exit(1);
  }

  if (user.role === Role.SUPER_ADMIN) {
    console.log(`User ${user.email} (${user.anonymousId}) is already a SUPER_ADMIN.`);
    process.exit(0);
  }

  if (user.role !== Role.ADMIN && !force) {
    console.error(
      `Warning: User ${user.email} (${user.anonymousId}) currently has role "${user.role}".`
    );
    console.error("To promote a non-admin user directly to SUPER_ADMIN, supply the --force flag.");
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: Role.SUPER_ADMIN },
    select: {
      id: true,
      email: true,
      anonymousId: true,
      role: true,
      firstName: true,
      lastName: true,
    },
  });

  console.log(`Success: Promoted ${updated.firstName} ${updated.lastName} (${updated.email}, ${updated.anonymousId}) to SUPER_ADMIN.`);
}

main()
  .catch((e) => {
    console.error("Execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
