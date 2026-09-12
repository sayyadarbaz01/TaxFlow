import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Cleaning database and removing all dummy data & old RBAC...");



  // 2. Clean up all operational and dummy records
  await prisma.auditLog.deleteMany({});
  await prisma.aiMessage.deleteMany({});
  await prisma.aiConversation.deleteMany({});
  await prisma.whatsAppMessage.deleteMany({});
  await prisma.whatsAppTemplate.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.tdsTcsEntry.deleteMany({});
  await prisma.gstReturn.deleteMany({});
  await prisma.itrFiling.deleteMany({});
  await prisma.clientDocument.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({});

  console.log("✅ All dummy clients, documents, filings, tasks, invoices, and old users removed.");

  // 3. Create the 2 Essential Roles: SuperAdmin and Admin
  console.log("🌱 Creating SuperAdmin and Admin roles...");

  const superAdminRole = await prisma.role.create({
    data: {
      name: "SuperAdmin",
      description: "Super Administrator with full access to all system settings, user management, and operational modules"
    }
  });

  const adminRole = await prisma.role.create({
    data: {
      name: "Admin",
      description: "Administrator with full access to client CRM, tax operations, GST, ITR, TDS, and billing"
    }
  });

  // 4. Create Initial Clean Accounts
  console.log("🌱 Creating clean initial accounts...");
  const defaultPasswordHash = await argon2.hash("Password123!");

  const superAdminUser = await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "superadmin@taxflow.com",
      passwordHash: defaultPasswordHash,
      roleId: superAdminRole.id
    }
  });

  const adminUser = await prisma.user.create({
    data: {
      name: "Firm Admin",
      email: "admin@taxflow.com",
      passwordHash: defaultPasswordHash,
      roleId: adminRole.id
    }
  });

  console.log("=================================================");
  console.log("🎉 Database cleanly reset with zero dummy data!");
  console.log("Initial Credentials:");
  console.log(`  1. SuperAdmin: ${superAdminUser.email} / Password123!`);
  console.log(`  2. Admin:      ${adminUser.email} / Password123!`);
  console.log("=================================================");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
