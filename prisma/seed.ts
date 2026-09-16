import { PrismaClient, TemplateCategory, TemplateStatus } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Purging all test and dummy data in PostgreSQL (casaas_db)...");

  // 1. Clean existing data across all tables
  await prisma.auditLog.deleteMany({});
  await prisma.aiMessage.deleteMany({});
  await prisma.aiConversation.deleteMany({});
  await prisma.documentEmbedding.deleteMany({});
  await prisma.whatsAppMessage.deleteMany({});
  await prisma.whatsAppTemplate.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.tdsTcsEntry.deleteMany({});
  await prisma.gstReturn.deleteMany({});
  await prisma.itrFiling.deleteMany({});
  await prisma.clientDocument.deleteMany({});
  await prisma.clientService.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({});

  console.log("✅ All test clients, services, filings, tasks, invoices, and documents removed.");

  // 2. Roles
  const superAdminRole = await prisma.role.create({
    data: {
      name: "SuperAdmin",
      description: "Super Administrator with full access to all system settings and operational modules"
    }
  });

  await prisma.role.create({
    data: {
      name: "Admin",
      description: "Standard Administrator with full access to client CRM, tax operations, GST, ITR, TDS, and billing"
    }
  });

  await prisma.role.create({
    data: {
      name: "Staff",
      description: "Audit and tax associate for file preparation and task execution"
    }
  });

  // 3. SuperAdmin User
  const passwordHash = await argon2.hash("Pass@123");
  const superAdmin = await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "superadmin@taxflow.com",
      passwordHash,
      roleId: superAdminRole.id
    }
  });

  // 4. Standard WhatsApp Notification Templates
  await prisma.whatsAppTemplate.create({
    data: {
      name: "ITR Filing Confirmation",
      category: TemplateCategory.UTILITY,
      body: "Dear {{1}}, your ITR for AY 2026-27 has been filed successfully with Ack No {{2}}. - TaxFlow CA",
      variables: ["name", "ackNo"],
      approvalStatus: TemplateStatus.APPROVED
    }
  });

  await prisma.whatsAppTemplate.create({
    data: {
      name: "GST Return Due Date Reminder",
      category: TemplateCategory.UTILITY,
      body: "Dear {{1}}, reminder that your {{2}} return for {{3}} is due on {{4}}. Please provide documents. - TaxFlow CA",
      variables: ["name", "returnType", "period", "dueDate"],
      approvalStatus: TemplateStatus.APPROVED
    }
  });

  await prisma.whatsAppTemplate.create({
    data: {
      name: "Fee Invoice & Dynamic UPI",
      category: TemplateCategory.UTILITY,
      body: "Dear {{1}}, your professional services invoice {{2}} for INR {{3}} is ready. Pay via UPI: {{4}}",
      variables: ["name", "invoiceNo", "amount", "upiLink"],
      approvalStatus: TemplateStatus.APPROVED
    }
  });

  console.log("=================================================");
  console.log("🎉 Database cleanly reset with ZERO test data!");
  console.log("Active Account:");
  console.log(`  SuperAdmin: ${superAdmin.email} / Pass@123`);
  console.log("=================================================");
}

main()
  .catch(e => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
