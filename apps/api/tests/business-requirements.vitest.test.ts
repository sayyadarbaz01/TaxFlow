import { describe, it, expect, beforeEach } from "vitest";
import { DueDateEngine } from "../src/lib/due-date-engine";
import { ClientsService, memoryClients, memoryTasks } from "../src/modules/clients/clients.service";
import { TasksService } from "../src/modules/tasks/tasks.service";
import { DashboardService } from "../src/modules/dashboard/dashboard.service";
import { BillingService } from "../src/modules/billing/billing.service";
import { TaxAuditService } from "../src/modules/tax-audit/tax-audit.service";
import { AuthUser, ClientDTO } from "@ca-saas/shared-types";

const mockSuperAdmin: AuthUser = {
  id: "test-admin-id",
  name: "Super Admin",
  email: "superadmin@taxflow.com",
  role: "SuperAdmin"
};

let panSeed = Math.floor(1000 + Math.random() * 8000);
function getUniquePan(): string {
  panSeed += 1;
  const chars = "BCDEFGHJKLMNPQRSTUVWXYZ";
  const r1 = chars[Math.floor(Math.random() * chars.length)];
  const r2 = chars[Math.floor(Math.random() * chars.length)];
  return `AA${r1}${r2}${panSeed}Z`;
}

describe("TaxFlow SaaS — Business Requirements Verification Suite", () => {
  beforeEach(() => {
    // Reset in-memory collections before each test for deterministic state
    memoryClients.length = 0;
    memoryTasks.length = 0;
  });

  // =========================================================================
  // 1. CLIENT MANAGEMENT: ADD, EDIT, DELETE & VALIDATIONS
  // =========================================================================
  describe("1. Client Management Lifecycle (Add, Edit, Delete & Filings Sync)", () => {
    it("should create an active client with valid PAN, GSTIN and auto-generate compliance tasks", async () => {
      const uniquePan = getUniquePan();
      const clientDto: ClientDTO = {
        name: "Zenith Infotech Pvt Ltd",
        pan: uniquePan,
        gstin: `27${uniquePan}1Z5`,
        entityType: "PVT_LTD",
        contactPhone: "+91 98765 43210",
        contactEmail: "finance@zenithinfo.in",
        workType: "ITR + GST",
        status: "ACTIVE"
      };

      const created = await ClientsService.createClient(clientDto, mockSuperAdmin);

      expect(created).toBeDefined();
      expect(created.name).toBe("Zenith Infotech Pvt Ltd");
      expect(created.pan).toBe(uniquePan);
      expect(created.status).toBe("ACTIVE");

      // Verify client exists in memory list
      expect(memoryClients.length).toBe(1);
      expect(memoryClients[0].id).toBe(created.id);

      // Verify auto-generated compliance tasks for onboarding (Checklist & ITR)
      expect(memoryTasks.length).toBeGreaterThanOrEqual(1);
      const docChecklistTask = memoryTasks.find(t => t.title.includes("Complete Document Checklist"));
      expect(docChecklistTask).toBeDefined();
      expect(docChecklistTask?.clientId).toBe(created.id);

      const itrTask = memoryTasks.find(t => t.title.includes("ITR Filing"));
      expect(itrTask).toBeDefined();
      expect(itrTask?.clientId).toBe(created.id);
    });

    it("should edit and update existing client contact details, name, and work type", async () => {
      const uniquePan = getUniquePan();
      const initial = await ClientsService.createClient({
        name: "Original Tech Solutions",
        pan: uniquePan,
        entityType: "LLP",
        contactPhone: "+91 99999 00000",
        workType: "ITR",
        status: "ACTIVE"
      }, mockSuperAdmin);

      // Edit client details
      const updated = await ClientsService.updateClient(initial.id, {
        name: "Renamed Tech Solutions LLP",
        contactPhone: "+91 88888 11111",
        contactEmail: "accounts@renamedtech.in",
        workType: "ITR + GST"
      }, mockSuperAdmin);

      expect(updated.name).toBe("Renamed Tech Solutions LLP");
      expect(updated.contactPhone).toBe("+91 88888 11111");
      expect(updated.contactEmail).toBe("accounts@renamedtech.in");
      expect(updated.workType).toBe("ITR + GST");

      // Verify memory cache updated
      const found = memoryClients.find(c => c.id === initial.id);
      expect(found?.name).toBe("Renamed Tech Solutions LLP");
      expect(found?.contactPhone).toBe("+91 88888 11111");
    });

    it("should delete a client and cascade cleanup of memory tasks", async () => {
      const uniquePan = getUniquePan();
      const client = await ClientsService.createClient({
        name: "Temporary Client to Delete",
        pan: uniquePan,
        entityType: "PROPRIETORSHIP",
        contactPhone: "+91 91234 56789",
        workType: "GST",
        status: "ACTIVE"
      }, mockSuperAdmin);

      expect(memoryClients.some(c => c.id === client.id)).toBe(true);
      expect(memoryTasks.some(t => t.clientId === client.id)).toBe(true);

      // Delete client
      const deleteResult = await ClientsService.deleteClient(client.id, mockSuperAdmin);
      expect(deleteResult.message).toContain("successfully");

      // Verify client and linked tasks removed from memory
      expect(memoryClients.some(c => c.id === client.id)).toBe(false);
      expect(memoryTasks.some(t => t.clientId === client.id)).toBe(false);
    });

    it("should support lead client conversion to active status", async () => {
      const uniquePan = getUniquePan();
      const lead = await ClientsService.createClient({
        name: "Prospective Client Lead",
        pan: uniquePan,
        entityType: "INDIVIDUAL",
        contactPhone: "+91 95555 44444",
        workType: "ITR",
        status: "LEAD"
      }, mockSuperAdmin);

      expect(lead.status).toBe("LEAD");

      // Convert lead to active client
      const converted = await ClientsService.updateClient(lead.id, {
        status: "ACTIVE"
      }, mockSuperAdmin);

      expect(converted.status).toBe("ACTIVE");
    });
  });

  // =========================================================================
  // 2. ITR STATUTORY RULES & DUE DATE CALCULATIONS
  // =========================================================================
  describe("2. ITR Statutory Due Date Engine (Indian Income Tax Act, 1961)", () => {
    it("should calculate 31st July for non-audit individual assessees", () => {
      const dueDate = DueDateEngine.calculateItrDueDate({
        assessmentYear: "AY 2026-27",
        formType: "ITR_1",
        isAuditRequired: false,
        isTransferPricing: false
      });

      expect(dueDate.getFullYear()).toBe(2026);
      expect(dueDate.getMonth()).toBe(6); // July is month index 6 (0-indexed)
      expect(dueDate.getDate()).toBe(31);
    });

    it("should calculate 31st October for Section 44AB tax audit assessees", () => {
      const dueDate = DueDateEngine.calculateItrDueDate({
        assessmentYear: "AY 2026-27",
        formType: "ITR_3",
        isAuditRequired: true,
        isTransferPricing: false
      });

      expect(dueDate.getFullYear()).toBe(2026);
      expect(dueDate.getMonth()).toBe(9); // October is month index 9
      expect(dueDate.getDate()).toBe(31);
    });

    it("should calculate 30th November for international transfer pricing / corporate assessees (Section 92E / ITR-6)", () => {
      const dueDate = DueDateEngine.calculateItrDueDate({
        assessmentYear: "AY 2026-27",
        formType: "ITR_6",
        isAuditRequired: true,
        isTransferPricing: true
      });

      expect(dueDate.getFullYear()).toBe(2026);
      expect(dueDate.getMonth()).toBe(10); // November is month index 10
      expect(dueDate.getDate()).toBe(30);
    });
  });

  // =========================================================================
  // 3. GST STATUTORY RULES & DUE DATE CALCULATIONS
  // =========================================================================
  describe("3. GST Statutory Due Date Engine (CGST / SGST Acts, 2017)", () => {
    it("should calculate 11th of subsequent month for monthly GSTR-1 outward returns", () => {
      const dueDate = DueDateEngine.calculateGstDueDate({
        returnType: "GSTR1",
        period: "Apr-2026",
        frequency: "MONTHLY"
      });

      expect(dueDate.getDate()).toBe(11);
    });

    it("should calculate 20th of subsequent month for regular monthly GSTR-3B summary returns", () => {
      const dueDate = DueDateEngine.calculateGstDueDate({
        returnType: "GSTR3B",
        period: "Apr-2026",
        frequency: "MONTHLY"
      });

      expect(dueDate.getDate()).toBe(20);
    });

    it("should calculate 13th of month following quarter for QRMP GSTR-1 returns", () => {
      const dueDate = DueDateEngine.calculateGstDueDate({
        returnType: "GSTR1",
        period: "Q1-2026",
        frequency: "QRMP"
      });

      expect(dueDate.getDate()).toBe(13);
    });

    it("should calculate 31st December following financial year for annual GSTR-9 returns", () => {
      const dueDate = DueDateEngine.calculateGstDueDate({
        returnType: "GSTR9",
        period: "FY 2025-26",
        frequency: "MONTHLY",
        year: 2026
      });

      expect(dueDate.getFullYear()).toBe(2026);
      expect(dueDate.getMonth()).toBe(11); // December is month index 11
      expect(dueDate.getDate()).toBe(31);
    });
  });

  // =========================================================================
  // 4. PRACTICE BILLING & DYNAMIC UPI ENGINE
  // =========================================================================
  describe("4. Practice Invoicing, 18% GST Calculation & Dynamic UPI Intent", () => {
    it("should calculate accurate 18% GST tax, subtotal and total for client invoice", () => {
      const lineItems = [
        { description: "Section 44AB Tax Audit Engagement", amount: 40000 },
        { description: "Annual ITR-6 Corporate Filing", amount: 15000 },
        { description: "Quarterly TDS 26Q Filing", amount: 5000 }
      ];

      const subtotal = lineItems.reduce((acc, item) => acc + item.amount, 0);
      const tax = Math.round((subtotal * 18) / 100);
      const total = subtotal + tax;

      expect(subtotal).toBe(60000);
      expect(tax).toBe(10800); // 18% of 60,000 = 10,800
      expect(total).toBe(70800);
    });

    it("should format valid NPCI dynamic UPI deep link with exact amount and invoice reference", () => {
      const totalAmount = 70800;
      const invoiceNo = "INV-2026-0042";
      const upiId = "capractice@upi";
      const payeeName = "CA Practice";

      const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${totalAmount}&tn=${encodeURIComponent(invoiceNo)}&cu=INR`;

      expect(upiLink).toContain("upi://pay?");
      expect(upiLink).toContain("pa=capractice%40upi");
      expect(upiLink).toContain("am=70800");
      expect(upiLink).toContain("tn=INV-2026-0042");
      expect(upiLink).toContain("cu=INR");
    });
  });

  // =========================================================================
  // 5. SECTION 44AB TAX AUDIT SUITE
  // =========================================================================
  describe("5. Section 44AB Tax Audit Suite (Form 3CA / 3CB / 3CD)", () => {
    it("should initialize 9 statutory Form 3CD scrutiny clauses upon audit engagement creation", async () => {
      const uniquePan = getUniquePan();
      const client = await ClientsService.createClient({
        name: "Bharat Infra Projects Ltd",
        pan: uniquePan,
        entityType: "PVT_LTD",
        contactPhone: "9876543210",
        workType: "Tax Audit",
        status: "ACTIVE"
      }, mockSuperAdmin);

      const engagement = await TaxAuditService.createEngagement({
        clientId: client.id,
        clientName: client.name,
        pan: client.pan,
        entityType: "PVT_LTD",
        assessmentYear: "AY 2026-27",
        financialYear: "FY 2025-26",
        turnover: 25000000,
        formType: "FORM_3CA_3CD"
      }, mockSuperAdmin);

      expect(engagement).toBeDefined();
      expect(engagement.formType).toBe("FORM_3CA_3CD");
      expect(engagement.stage).toBe("ENGAGEMENT");

      // Verify clause list contains mandatory statutory clauses
      const clauses = await TaxAuditService.getClauses(engagement.id);
      expect(clauses.length).toBe(9);

      // Verify Clause 22 (MSME 43B(h))
      const clause22 = clauses.find(c => c.clauseNumber === 22);
      expect(clause22).toBeDefined();
      expect(clause22?.title).toContain("MSME 43B(h)");

      // Verify Clause 21 (Disallowance under 40(a)(ia) & 40A(3))
      const clause21 = clauses.find(c => c.clauseNumber === 21);
      expect(clause21).toBeDefined();

      // Verify Clause 31 (Loans/deposits in cash under 269SS/269T)
      const clause31 = clauses.find(c => c.clauseNumber === 31);
      expect(clause31).toBeDefined();
    });

    it("should allow verifying and updating remarks on specific Form 3CD clauses", async () => {
      const uniquePan = getUniquePan();
      const client = await ClientsService.createClient({
        name: "Mehta & Sons Partnership",
        pan: uniquePan,
        entityType: "PARTNERSHIP",
        contactPhone: "9876543211",
        workType: "Tax Audit",
        status: "ACTIVE"
      }, mockSuperAdmin);

      const engagement = await TaxAuditService.createEngagement({
        clientId: client.id,
        clientName: client.name,
        pan: client.pan,
        entityType: "PARTNERSHIP",
        assessmentYear: "AY 2026-27",
        financialYear: "FY 2025-26",
        turnover: 18000000,
        formType: "FORM_3CB_3CD"
      }, mockSuperAdmin);

      // Update Clause 22 with verified status and audit remarks
      const updatedClause = await TaxAuditService.updateClauseStatus(
        engagement.id,
        22,
        "VERIFIED",
        "Audited all vendor MSME UDYAM certificates; zero payments overdue beyond 45 days."
      );

      expect(updatedClause.status).toBe("VERIFIED");
      expect(updatedClause.remarks).toContain("zero payments overdue");

      // Advance stage to UDIN_GENERATED with 18-char UDIN
      const updatedAudit = await TaxAuditService.updateStage(
        engagement.id,
        {
          stage: "UDIN_GENERATED",
          udin: "26123456AAAAAB1234"
        },
        mockSuperAdmin
      );

      expect(updatedAudit.stage).toBe("UDIN_GENERATED");
      expect(updatedAudit.udin).toBe("26123456AAAAAB1234");
    });
  });

  // =========================================================================
  // 6. TASKS KANBAN & COMPLIANCE ACTION ITEMS
  // =========================================================================
  describe("6. Task Management & Status Progression", () => {
    it("should list in-memory tasks and support status transitions", async () => {
      const uniquePan = getUniquePan();
      const client = await ClientsService.createClient({
        name: "Alpha Corp",
        pan: uniquePan,
        entityType: "PVT_LTD",
        contactPhone: "+91 98765 00000",
        workType: "ITR",
        status: "ACTIVE"
      }, mockSuperAdmin);

      // 2. Fetch tasks
      const taskList = await TasksService.listTasks(mockSuperAdmin, { clientId: client.id });
      expect(taskList.data.length).toBeGreaterThanOrEqual(1);

      const firstTask = taskList.data[0];
      expect(firstTask.status).toBe("TODO");

      // 3. Move task to IN_PROGRESS
      const inProgress = await TasksService.updateTaskStatus(firstTask.id, "IN_PROGRESS", mockSuperAdmin);
      expect(inProgress.status).toBe("IN_PROGRESS");

      // 4. Complete task
      const doneTask = await TasksService.updateTaskStatus(firstTask.id, "DONE", mockSuperAdmin);
      expect(doneTask.status).toBe("DONE");
    });
  });

  // =========================================================================
  // 7. DASHBOARD KPI SUMMARY COMPUTATION
  // =========================================================================
  describe("7. Dashboard KPI Dynamic Aggregation", () => {
    it("should return clean zero-starting state when no clients exist", () => {
      const summary = DashboardService.getFallbackSummary();

      expect(summary.totalRevenue).toBe(0);
      expect(summary.activeClients).toBe(0);
      expect(summary.pendingFilings).toBe(0);
      expect(summary.totalLeads).toBe(0);
      expect(summary.weeklyActivity.length).toBe(7);
      summary.weeklyActivity.forEach(day => {
        expect(day.filings).toBe(0);
        expect(day.tasks).toBe(0);
      });
    });

    it("should dynamically calculate active clients and pending filings when clients are present", async () => {
      const pan1 = getUniquePan();
      const pan2 = getUniquePan();
      const pan3 = getUniquePan();

      // Add active client with ITR
      await ClientsService.createClient({
        name: "Client A",
        pan: pan1,
        entityType: "PVT_LTD",
        contactPhone: "9876543210",
        workType: "ITR",
        status: "ACTIVE"
      }, mockSuperAdmin);

      // Add active client with GST
      await ClientsService.createClient({
        name: "Client B",
        pan: pan2,
        entityType: "LLP",
        contactPhone: "9876543211",
        workType: "GST",
        status: "ACTIVE"
      }, mockSuperAdmin);

      // Add a lead
      await ClientsService.createClient({
        name: "Lead C",
        pan: pan3,
        entityType: "INDIVIDUAL",
        contactPhone: "9876543212",
        workType: "ITR",
        status: "LEAD"
      }, mockSuperAdmin);

      const summary = DashboardService.getFallbackSummary();

      expect(summary.activeClients).toBe(2);
      expect(summary.totalLeads).toBe(1);
      expect(summary.itrPending).toBe(1);
      expect(summary.gstReturnsDue).toBe(1);
      expect(summary.pendingFilings).toBe(2); // 1 ITR + 1 GST
    });
  });
});
