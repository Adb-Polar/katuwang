import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import { Role, AccountStatus } from "@prisma/client";
import { generateAnonymousId } from "../src/lib/idGenerator";

async function main() {
  const args = process.argv.slice(2);
  const email = (args[0] || process.env.SUPER_ADMIN_EMAIL || "superadmin@katuwang.test").trim().toLowerCase();
  const password = args[1] || process.env.SUPER_ADMIN_PASSWORD || "password123";
  const firstName = args[2] || "Super";
  const lastName = args[3] || "Admin";

  console.log(`\n🌱 Seeding Super Admin account for "${email}"...`);

  const passwordHash = await bcrypt.hash(password, 10);

  // Check if account already exists
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { recoveryEmail: email }],
    },
  });

  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: Role.SUPER_ADMIN,
        status: AccountStatus.ACTIVE,
        password: passwordHash,
        emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
        consentGiven: true,
      },
      select: {
        id: true,
        anonymousId: true,
        email: true,
        role: true,
        status: true,
        firstName: true,
        lastName: true,
      },
    });

    console.log("✅ Super Admin account updated successfully:");
    console.log(`   - ID:          ${updated.anonymousId}`);
    console.log(`   - Name:        ${updated.firstName} ${updated.lastName}`);
    console.log(`   - Email:       ${updated.email}`);
    console.log(`   - Role:        ${updated.role}`);
    console.log(`   - Status:      ${updated.status}`);
    console.log(`   - Password:    ${password}\n`);
    return;
  }

  // Use ADM-0002 if available, otherwise generate next sequential ADM-xxxx
  let anonymousId = "ADM-0002";
  const idTaken = await prisma.user.findUnique({
    where: { anonymousId },
  });

  if (idTaken) {
    anonymousId = await generateAnonymousId("ADMIN");
  }

  const created = await prisma.user.create({
    data: {
      anonymousId,
      firstName,
      lastName,
      email,
      password: passwordHash,
      role: Role.SUPER_ADMIN,
      status: AccountStatus.ACTIVE,
      gradeLevel: "GRADE_12",
      section: "ADMIN",
      consentGiven: true,
      emailVerifiedAt: new Date(),
    },
    select: {
      id: true,
      anonymousId: true,
      email: true,
      role: true,
      status: true,
      firstName: true,
      lastName: true,
    },
  });

  console.log("✅ Super Admin account created successfully:");
  console.log(`   - ID:          ${created.anonymousId}`);
  console.log(`   - Name:        ${created.firstName} ${created.lastName}`);
  console.log(`   - Email:       ${created.email}`);
  console.log(`   - Role:        ${created.role}`);
  console.log(`   - Status:      ${created.status}`);
  console.log(`   - Password:    ${password}\n`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding Super Admin failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
