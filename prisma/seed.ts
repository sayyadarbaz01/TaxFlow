import { PrismaClient, EntityType, ItrFormType, GstReturnType, GstFilingFrequency, TaskPriority, TaskStatus, InvoiceStatus, TdsEntryType } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding real database in PostgreSQL (casaas_db)...");

  // Clean existing data
  await prisma.auditLog.deleteMany({});
  await prisma.aiMessage.deleteMany({});
  await prisma.aiConversation.deleteMany({});
  await prisma.whatsAppMessage.deleteMany({});
  await prisma.whatsAppTemplate.deleteMany({});
  await prisma.payment.deleteMany({});
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

  // 1. Roles
  const superAdminRole = await prisma.role.create({
    data: {
      name: "SuperAdmin",
      description: "Super Administrator with full access"
    }
  });

  const adminRole = await prisma.role.create({
    data: {
      name: "Admin",
      description: "Standard Administrator"
    }
  });

  const staffRole = await prisma.role.create({
    data: {
      name: "Staff",
      description: "Audit and tax associate"
    }
  });

  // 2. SuperAdmin User
  const passwordHash = await argon2.hash("Pass@123");
  const superAdmin = await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "superadmin@taxflow.com",
      passwordHash,
      roleId: superAdminRole.id
    }
  });

  // 3. Operational Clients
  const client1 = await prisma.client.create({
    data: {
      name: "Acme Logistics Pvt Ltd",
      pan: "AAACA1234A",
      gstin: "27AAACA1234A1Z5",
      entityType: EntityType.PVT_LTD,
      contactPhone: "+91 98765 43210",
      contactEmail: "accounts@acmelogistics.in",
      workType: "ITR + GST",
      assignedStaffId: superAdmin.id,
      status: "ACTIVE"
    }
  });

  const client2 = await prisma.client.create({
    data: {
      name: "Sharma & Associates LLP",
      pan: "AALFS5678B",
      gstin: "27AALFS5678B1Z2",
      entityType: EntityType.LLP,
      contactPhone: "+91 98234 56789",
      contactEmail: "tax@sharmallp.com",
      workType: "Tax Audit",
      assignedStaffId: superAdmin.id,
      status: "ACTIVE"
    }
  });

  const client3 = await prisma.client.create({
    data: {
      name: "Priya Fashion Mart",
      pan: "BCDPP9012C",
      gstin: "27BCDPP9012C1Z8",
      entityType: EntityType.PROPRIETORSHIP,
      contactPhone: "+91 99887 76655",
      contactEmail: "priya@fashionmart.in",
      workType: "GST",
      assignedStaffId: superAdmin.id,
      status: "ACTIVE"
    }
  });

  const client4 = await prisma.client.create({
    data: {
      name: "Apex Healthcare Labs",
      pan: "AAACH9988D",
      gstin: null,
      entityType: EntityType.PARTNERSHIP,
      contactPhone: "+91 91234 56780",
      contactEmail: "contact@apexlabs.in",
      workType: "GST Registration",
      assignedStaffId: superAdmin.id,
      status: "LEAD"
    }
  });

  // 4. Invoices
  await prisma.invoice.create({
    data: {
      invoiceNo: "INV-2026-001",
      clientId: client1.id,
      subtotal: 25000,
      tax: 4500,
      total: 29500,
      lineItems: [{ description: "Annual ITR Filing & Advisory", amount: 25000 }],
      dueDate: new Date("2026-09-25"),
      status: InvoiceStatus.SENT,
      upiLink: "upi://pay?pa=capractice@upi&pn=CA%20Practice&am=29500&tn=INV-2026-001&cu=INR"
    }
  });

  await prisma.invoice.create({
    data: {
      invoiceNo: "INV-2026-002",
      clientId: client2.id,
      subtotal: 50000,
      tax: 9000,
      total: 59000,
      lineItems: [{ description: "Section 44AB Tax Audit Engagement", amount: 50000 }],
      dueDate: new Date("2026-09-10"),
      status: InvoiceStatus.OVERDUE,
      upiLink: "upi://pay?pa=capractice@upi&pn=CA%20Practice&am=59000&tn=INV-2026-002&cu=INR"
    }
  });

  // 5. ITR Filings
  await prisma.itrFiling.create({
    data: {
      clientId: client1.id,
      assessmentYear: "AY 2026-27",
      itrFormType: ItrFormType.ITR_6,
      dueDate: new Date("2026-10-31"),
      status: "UNDER_PREPARATION",
      assignedStaffId: superAdmin.id
    }
  });

  await prisma.itrFiling.create({
    data: {
      clientId: client2.id,
      assessmentYear: "AY 2026-27",
      itrFormType: ItrFormType.ITR_5,
      dueDate: new Date("2026-10-31"),
      status: "DOCUMENTS_PENDING",
      assignedStaffId: superAdmin.id
    }
  });

  // 6. GST Returns
  await prisma.gstReturn.create({
    data: {
      clientId: client1.id,
      returnType: GstReturnType.GSTR1,
      period: "August 2026",
      filingFrequency: GstFilingFrequency.MONTHLY,
      dueDate: new Date("2026-09-11"),
      status: "PENDING"
    }
  });

  await prisma.gstReturn.create({
    data: {
      clientId: client3.id,
      returnType: GstReturnType.GSTR3B,
      period: "August 2026",
      filingFrequency: GstFilingFrequency.MONTHLY,
      dueDate: new Date("2026-09-20"),
      status: "NOT_STARTED"
    }
  });

  // 7. Tasks
  await prisma.task.create({
    data: {
      title: "Collect Bank Statements for Q1 Reconciliation",
      clientId: client1.id,
      assignedTo: superAdmin.id,
      dueDate: new Date("2026-09-15"),
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM
    }
  });

  await prisma.task.create({
    data: {
      title: "Verify Form 3CD Clause 22 MSME 45-day overdue vendors",
      clientId: client2.id,
      assignedTo: superAdmin.id,
      dueDate: new Date("2026-09-20"),
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH
    }
  });

  // 8. TDS / TCS
  await prisma.tdsTcsEntry.create({
    data: {
      clientId: client1.id,
      financialYear: "FY 2025-26",
      deductorTan: "MUMA12345B",
      amount: 15400,
      entryType: TdsEntryType.TDS,
      reconciliationStatus: "MATCHED",
      expectedAmount: 15400,
      creditedAmount: 15400,
      mismatchAmount: 0
    }
  });

  // 9. WhatsApp Templates
  await prisma.whatsAppTemplate.create({
    data: {
      name: "ITR Filing Confirmation",
      category: "UTILITY",
      body: "Dear {{1}}, your ITR for AY 2026-27 has been filed successfully with Ack No {{2}}. - TaxFlow CA",
      variables: ["name", "ackNo"],
      approvalStatus: "APPROVED"
    }
  });

  await prisma.whatsAppTemplate.create({
    data: {
      name: "GST Return Due Date Reminder",
      category: "UTILITY",
      body: "Dear {{1}}, reminder that your {{2}} return for {{3}} is due on {{4}}. Please provide documents. - TaxFlow CA",
      variables: ["name", "returnType", "period", "dueDate"],
      approvalStatus: "APPROVED"
    }
  });

  await prisma.whatsAppTemplate.create({
    data: {
      name: "Fee Invoice & Dynamic UPI",
      category: "UTILITY",
      body: "Dear {{1}}, your professional services invoice {{2}} for INR {{3}} is ready. Pay via UPI: {{4}}",
      variables: ["name", "invoiceNo", "amount", "upiLink"],
      approvalStatus: "APPROVED"
    }
  });

  console.log("=================================================");
  console.log("🎉 Real PostgreSQL database seeded successfully!");
  console.log("Active Login: superadmin@taxflow.com / Pass@123");
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
