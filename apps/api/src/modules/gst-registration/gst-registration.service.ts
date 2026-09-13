import { prisma } from "../../lib/db";
import { buildPaginationParams, formatPaginatedResponse } from "../../lib/utils";
import { NotFoundError, ValidationError } from "../../middleware/errorHandler";
import { DueDateEngine } from "../../lib/due-date-engine";
import {
  AuthUser,
  GstRegistrationRecord,
  CreateGstRegDTO,
  GstRegStage
} from "@ca-saas/shared-types";

// In-memory store initialized with active registrations & prospective GST clients
const inMemoryGstRegistrations: Map<string, GstRegistrationRecord> = new Map();

export class GstRegistrationService {
  private static async ensureInitialized() {
    // Store starts completely clean; data is created via createApplication
  }

  public static async listApplications(_user: AuthUser, query: Record<string, any>) {
    await this.ensureInitialized();
    const { page, pageSize } = buildPaginationParams(query);

    let applications = Array.from(inMemoryGstRegistrations.values());

    // Search filter
    if (query.search) {
      const s = String(query.search).toLowerCase();
      applications = applications.filter(
        a =>
          a.businessName.toLowerCase().includes(s) ||
          a.pan.toLowerCase().includes(s) ||
          (a.trn && a.trn.toLowerCase().includes(s)) ||
          (a.arn && a.arn.toLowerCase().includes(s))
      );
    }

    // Stage filter
    if (query.stage && query.stage !== "ALL") {
      applications = applications.filter(a => a.stage === query.stage);
    }

    // Registration Type filter
    if (query.registrationType && query.registrationType !== "ALL") {
      applications = applications.filter(a => a.registrationType === query.registrationType);
    }

    const total = applications.length;
    const skip = (page - 1) * pageSize;
    const paginated = applications.slice(skip, skip + pageSize);

    return formatPaginatedResponse(paginated, total, page, pageSize);
  }

  public static async getSummary(_user: AuthUser) {
    await this.ensureInitialized();
    const list = Array.from(inMemoryGstRegistrations.values());

    return {
      totalPipeline: list.length,
      trnDrafts: list.filter(a => a.stage === "TRN_GENERATED").length,
      arnSubmitted: list.filter(a => a.stage === "ARN_SUBMITTED" || a.stage === "AADHAAR_AUTH").length,
      noticesPending: list.filter(a => a.stage === "CLARIFICATION_PENDING").length,
      certificatesIssued: list.filter(a => a.stage === "APPROVED_ISSUED").length
    };
  }

  public static async createApplication(dto: CreateGstRegDTO, user: AuthUser) {
    await this.ensureInitialized();

    const cleanPan = dto.pan.trim().toUpperCase();
    if (cleanPan.length !== 10) {
      throw new ValidationError("PAN must be exactly 10 characters.");
    }

    const id = `gstreg-${Date.now().toString(36)}`;
    const trn = dto.trn?.trim().toUpperCase() || `TRN26${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    const newApp: GstRegistrationRecord = {
      id,
      businessName: dto.businessName.trim(),
      pan: cleanPan,
      entityType: dto.entityType,
      registrationType: dto.registrationType || "REGULAR",
      state: dto.state || "Maharashtra (27)",
      jurisdictionWard: dto.jurisdictionWard || "State Jurisdictional Circle",
      trn,
      arn: null,
      stage: "TRN_GENERATED",
      submissionDate: null,
      aadhaarAuthStatus: "PENDING",
      queryNoticeRef: null,
      queryNoticeDate: null,
      queryReplyDate: null,
      gstin: null,
      approvalDate: null,
      contactPhone: dto.contactPhone.trim(),
      contactEmail: dto.contactEmail?.trim() || null,
      assignedStaffId: dto.assignedStaffId || user.id,
      assignedStaffName: user.name,
      clientId: dto.clientId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    inMemoryGstRegistrations.set(id, newApp);
    return newApp;
  }

  public static async advanceStage(
    id: string,
    body: {
      stage: GstRegStage;
      arn?: string;
      gstin?: string;
      queryNoticeRef?: string;
      queryReplyDate?: string;
    },
    _user: AuthUser
  ) {
    await this.ensureInitialized();
    const app = inMemoryGstRegistrations.get(id);
    if (!app) {
      throw new NotFoundError("GST Registration application not found");
    }

    app.stage = body.stage;
    app.updatedAt = new Date().toISOString();

    if (body.stage === "ARN_SUBMITTED") {
      app.arn = body.arn ? body.arn.trim().toUpperCase() : `AA270926${Math.floor(100000 + Math.random() * 900000)}Z`;
      app.submissionDate = new Date().toISOString().split("T")[0];
    }

    if (body.stage === "AADHAAR_AUTH") {
      app.aadhaarAuthStatus = "VERIFIED";
    }

    if (body.stage === "CLARIFICATION_PENDING") {
      app.queryNoticeRef = body.queryNoticeRef || `REG-03/NOT/${Math.floor(10000 + Math.random() * 90000)}`;
      app.queryNoticeDate = new Date().toISOString().split("T")[0];
    }

    if (body.stage === "APPROVED_ISSUED") {
      const stateCode = app.state.includes("(") ? app.state.split("(")[1].replace(")", "").trim() : "27";
      app.gstin = body.gstin ? body.gstin.trim().toUpperCase() : `${stateCode}${app.pan}1Z5`;
      app.approvalDate = new Date().toISOString().split("T")[0];
    }

    inMemoryGstRegistrations.set(id, app);
    return app;
  }

  public static async syncToClient(id: string, _user: AuthUser) {
    await this.ensureInitialized();
    const app = inMemoryGstRegistrations.get(id);
    if (!app) {
      throw new NotFoundError("GST Registration application not found");
    }

    if (!app.gstin) {
      throw new ValidationError("Cannot sync client: GSTIN has not yet been issued for this registration.");
    }

    let client: any = null;

    if (app.clientId) {
      // Update existing linked client
      client = await prisma.client.update({
        where: { id: app.clientId },
        data: {
          gstin: app.gstin,
          workType: "GST"
        }
      });
    } else {
      // Find by PAN or create new client in CRM
      const existing = await prisma.client.findFirst({ where: { pan: app.pan } });
      if (existing) {
        client = await prisma.client.update({
          where: { id: existing.id },
          data: {
            gstin: app.gstin,
            workType: "GST"
          }
        });
        app.clientId = existing.id;
      } else {
        client = await prisma.client.create({
          data: {
            name: app.businessName,
            pan: app.pan,
            gstin: app.gstin,
            entityType: app.entityType as any,
            contactPhone: app.contactPhone,
            contactEmail: app.contactEmail,
            workType: "GST",
            status: "ACTIVE"
          }
        });
        app.clientId = client.id;
      }
    }

    // Auto-provision initial GSTR-1 & GSTR-3B filings
    const existingGst = await prisma.gstReturn.findFirst({
      where: { clientId: client.id, period: "September 2026" }
    });

    if (!existingGst) {
      await prisma.gstReturn.create({
        data: {
          clientId: client.id,
          returnType: "GSTR3B",
          period: "September 2026",
          filingFrequency: "MONTHLY",
          dueDate: DueDateEngine.calculateGstDueDate({
            returnType: "GSTR3B",
            period: "September 2026",
            frequency: "MONTHLY"
          }),
          status: "PENDING"
        }
      });
    }

    inMemoryGstRegistrations.set(id, app);

    return {
      message: "GSTIN successfully synced to Client CRM and statutory filing schedules provisioned.",
      client,
      application: app
    };
  }
}
