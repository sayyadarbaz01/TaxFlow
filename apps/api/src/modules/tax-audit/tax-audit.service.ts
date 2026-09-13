import { prisma } from "../../lib/db";
import { buildPaginationParams, formatPaginatedResponse } from "../../lib/utils";
import { NotFoundError, ValidationError } from "../../middleware/errorHandler";
import {
  AuthUser,
  TaxAuditRecord,
  CreateTaxAuditDTO,
  TaxAuditStage,
  TaxAuditClauseItem
} from "@ca-saas/shared-types";

// Standard Section 44AB Form 3CD Core Statutory Clauses Checklist
const DEFAULT_3CD_CLAUSES: TaxAuditClauseItem[] = [
  {
    clauseNumber: 10,
    title: "Nature of Business or Profession & Changes during the FY",
    category: "General Information",
    isApplicable: true,
    status: "VERIFIED",
    remarks: "Verified against GST registration and MCA business activity codes."
  },
  {
    clauseNumber: 13,
    title: "Method of Accounting Employed (Mercantile / Cash & ICDS Compliance)",
    category: "Accounting Standards",
    isApplicable: true,
    status: "VERIFIED",
    remarks: "Mercantile system consistently followed; ICDS I to X disclosures documented."
  },
  {
    clauseNumber: 17,
    title: "Transfer of Land/Building for consideration below Stamp Duty Value (Sec 43CA / 50C)",
    category: "Capital & Immovable Assets",
    isApplicable: false,
    status: "VERIFIED",
    remarks: "No immovable property transfers during the assessment year."
  },
  {
    clauseNumber: 21,
    title: "Disallowances under Sec 40(a)(ia) [TDS Default] & Sec 40A(3) [Cash > ₹10,000]",
    category: "Expenses Disallowance",
    isApplicable: true,
    status: "PENDING",
    remarks: "Scrutiny of cash vouchers and 26Q/27Q TDS deductee lists under progress."
  },
  {
    clauseNumber: 22,
    title: "Amount Unpaid to Micro & Small Enterprises (MSME 43B(h) / MSMED Act, 2006)",
    category: "MSME Compliance",
    isApplicable: true,
    status: "FLAGGED",
    remarks: "2 supplier invoices pending beyond 45 days requiring interest & 43B(h) disallowance."
  },
  {
    clauseNumber: 26,
    title: "Statutory Liabilities unpaid on or before Due Date of ITR Filing (Sec 43B)",
    category: "Statutory Dues",
    isApplicable: true,
    status: "PENDING",
    remarks: "Reconciling March 2026 GST payments and provident fund deposit dates."
  },
  {
    clauseNumber: 31,
    title: "Acceptance / Repayment of Loan or Deposit in Cash > ₹20,000 (Sec 269SS / 269T)",
    category: "Cash Transactions",
    isApplicable: true,
    status: "VERIFIED",
    remarks: "All bank credits and debits verified; zero cash borrowings found."
  },
  {
    clauseNumber: 34,
    title: "Compliance with TDS / TCS Provisions & Quarterly Return Filings",
    category: "Withholding Taxes",
    isApplicable: true,
    status: "PENDING",
    remarks: "Matching Form 26AS tax credits and verifying timely challan deposits."
  },
  {
    clauseNumber: 44,
    title: "Break-up of Total Expenditure incurred: GST Registered vs Composite vs Unregistered",
    category: "GST Expenditure Reconciliation",
    isApplicable: true,
    status: "PENDING",
    remarks: "Extracting ledger expenses and tagging GSTIN suppliers."
  }
];

// In-memory store initialized with active clients requiring Tax Audit
const inMemoryAudits: Map<string, TaxAuditRecord> = new Map();
const auditClausesMap: Map<string, TaxAuditClauseItem[]> = new Map();

export class TaxAuditService {
  private static async ensureInitialized() {
    // Stores start completely clean; data is created via createEngagement
  }

  public static async listEngagements(_user: AuthUser, query: Record<string, any>) {
    await this.ensureInitialized();
    const { page, pageSize } = buildPaginationParams(query);

    let audits = Array.from(inMemoryAudits.values());

    // Search query filter
    if (query.search) {
      const s = String(query.search).toLowerCase();
      audits = audits.filter(a => a.clientName.toLowerCase().includes(s) || a.pan.toLowerCase().includes(s));
    }

    // Stage filter
    if (query.stage && query.stage !== "ALL") {
      audits = audits.filter(a => a.stage === query.stage);
    }

    // Form Type filter
    if (query.formType && query.formType !== "ALL") {
      audits = audits.filter(a => a.formType === query.formType);
    }

    // Assessment Year filter
    if (query.assessmentYear) {
      audits = audits.filter(a => a.assessmentYear === query.assessmentYear);
    }

    // Client ID filter
    if (query.clientId) {
      audits = audits.filter(a => a.clientId === query.clientId);
    }

    const total = audits.length;
    const skip = (page - 1) * pageSize;
    const paginated = audits.slice(skip, skip + pageSize);

    return formatPaginatedResponse(paginated, total, page, pageSize);
  }

  public static async getSummary(_user: AuthUser) {
    await this.ensureInitialized();
    const audits = Array.from(inMemoryAudits.values());

    const totalEngagements = audits.length;
    const form3CA3CDCount = audits.filter(a => a.formType === "FORM_3CA_3CD").length;
    const form3CB3CDCount = audits.filter(a => a.formType === "FORM_3CB_3CD").length;
    const pendingUdinCount = audits.filter(a => (a.stage === "FORM_3CD_PREP" || a.stage === "UDIN_GENERATED") && !a.udin).length;
    const completedCount = audits.filter(a => a.stage === "CLIENT_ACCEPTED" || a.stage === "PORTAL_FILED").length;

    return {
      totalEngagements,
      form3CA3CDCount,
      form3CB3CDCount,
      pendingUdinCount,
      completedCount,
      auditDueDate: "2026-09-30",
      itrAuditDueDate: "2026-10-31"
    };
  }

  public static async createEngagement(dto: CreateTaxAuditDTO, user: AuthUser) {
    await this.ensureInitialized();

    const client = await prisma.client.findUnique({
      where: { id: dto.clientId },
      include: { assignedStaff: { select: { id: true, name: true } } }
    });

    if (!client) {
      throw new NotFoundError("Client not found");
    }

    const id = `audit-${Date.now().toString(36)}`;
    const cashPct = dto.cashTxnPercentage !== undefined ? dto.cashTxnPercentage : 2.5;

    const newAudit: TaxAuditRecord = {
      id,
      clientId: client.id,
      clientName: client.name,
      pan: client.pan,
      entityType: client.entityType,
      assessmentYear: dto.assessmentYear || "AY 2026-27",
      formType: dto.formType,
      turnover: dto.turnover,
      cashTxnPercentage: cashPct,
      isCashLimitCompliant: cashPct <= 5.0,
      stage: "ENGAGEMENT",
      dueDate: dto.dueDate || "2026-09-30",
      udin: null,
      acknowledgementNo: null,
      assignedAuditorId: dto.assignedAuditorId || client.assignedStaffId || user.id,
      assignedAuditorName: client.assignedStaff?.name || user.name,
      verifiedClausesCount: 1,
      totalClausesCount: DEFAULT_3CD_CLAUSES.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    inMemoryAudits.set(id, newAudit);
    auditClausesMap.set(id, JSON.parse(JSON.stringify(DEFAULT_3CD_CLAUSES)));

    // Create Audit Paper Checklist Task in Task management
    try {
      await prisma.task.create({
        data: {
          title: `Form 3CD Clause Documentation: ${client.name}`,
          clientId: client.id,
          moduleRef: `TAX_AUDIT:${id}`,
          dueDate: new Date(2026, 8, 25), // 25 Sept
          priority: "HIGH",
          status: "TODO"
        }
      });
    } catch {
      // Non-critical background task creation
    }

    return newAudit;
  }

  public static async updateStage(
    id: string,
    body: { stage: TaxAuditStage; udin?: string; acknowledgementNo?: string },
    _user: AuthUser
  ) {
    await this.ensureInitialized();
    const audit = inMemoryAudits.get(id);
    if (!audit) {
      throw new NotFoundError("Tax Audit engagement not found");
    }

    if (body.stage === "UDIN_GENERATED" && body.udin) {
      // Validate ICAI UDIN format (18 characters)
      const cleanUdin = body.udin.trim().toUpperCase();
      if (cleanUdin.length !== 18) {
        throw new ValidationError("ICAI UDIN must be exactly 18 alphanumeric characters (e.g. 26123456AAAAAB1234)");
      }
      audit.udin = cleanUdin;
    }

    if (body.acknowledgementNo) {
      audit.acknowledgementNo = body.acknowledgementNo.trim();
    }

    audit.stage = body.stage;
    audit.updatedAt = new Date().toISOString();

    if (body.stage === "PORTAL_FILED" && !audit.acknowledgementNo) {
      audit.acknowledgementNo = `ACK${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    }

    if (body.stage === "CLIENT_ACCEPTED") {
      audit.verifiedClausesCount = audit.totalClausesCount;
    }

    inMemoryAudits.set(id, audit);
    return audit;
  }

  public static async getClauses(id: string) {
    await this.ensureInitialized();
    const clauses = auditClausesMap.get(id) || DEFAULT_3CD_CLAUSES;
    return clauses;
  }

  public static async updateClauseStatus(
    id: string,
    clauseNumber: number,
    status: "PENDING" | "VERIFIED" | "FLAGGED",
    remarks?: string
  ) {
    await this.ensureInitialized();
    const clauses = auditClausesMap.get(id);
    if (!clauses) {
      throw new NotFoundError("Clauses for audit engagement not found");
    }

    const clause = clauses.find(c => c.clauseNumber === clauseNumber);
    if (!clause) {
      throw new NotFoundError(`Clause ${clauseNumber} not found`);
    }

    clause.status = status;
    if (remarks !== undefined) clause.remarks = remarks;

    const audit = inMemoryAudits.get(id);
    if (audit) {
      audit.verifiedClausesCount = clauses.filter(c => c.status === "VERIFIED").length;
      audit.updatedAt = new Date().toISOString();
      inMemoryAudits.set(id, audit);
    }

    return clause;
  }
}
