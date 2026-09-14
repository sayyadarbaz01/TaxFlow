import { prisma, isDbCircuitOpen } from "../../lib/db";
import { scopeToAssignedClients } from "../../lib/permissions";
import { buildPaginationParams, formatPaginatedResponse } from "../../lib/utils";
import { eventBus } from "../../lib/event-bus";
import { DueDateEngine } from "../../lib/due-date-engine";
import { NotFoundError } from "../../middleware/errorHandler";
import { AuthUser, ItrStatus, ItrFormType } from "@ca-saas/shared-types";
import { memoryClients } from "../clients/clients.service";
import { logger } from "../../lib/logger";

export class ItrService {
  public static async listFilings(user: AuthUser, query: Record<string, any>) {
    const { page, pageSize, skip } = buildPaginationParams(query);
    const status = query.status as ItrStatus;

    if (!isDbCircuitOpen()) {
      try {
        const clientScope = scopeToAssignedClients(user, {});
        const whereCondition: any = { client: clientScope };
        if (query.clientId) {
          whereCondition.clientId = query.clientId;
        }
        if (query.status === "pending") {
          whereCondition.status = { in: ["NOT_STARTED", "DOCUMENTS_PENDING", "UNDER_PREPARATION", "FILED"] };
        } else if (status) {
          whereCondition.status = status;
        }

        const [filings, total] = await Promise.all([
          prisma.itrFiling.findMany({
            where: whereCondition,
            include: {
              client: { select: { id: true, name: true, pan: true, workType: true } },
              assignedStaff: { select: { id: true, name: true } }
            },
            skip,
            take: pageSize,
            orderBy: { dueDate: "asc" }
          }),
          prisma.itrFiling.count({ where: whereCondition })
        ]);

        const formatted = filings.map((f: any) => ({
          id: f.id,
          clientId: f.clientId,
          clientName: f.client?.name || "Unknown Client",
          workType: f.client?.workType || "ITR",
          assessmentYear: f.assessmentYear,
          itrFormType: f.itrFormType as any,
          dueDate: f.dueDate.toISOString().split("T")[0],
          status: f.status as any,
          filedAt: f.filedAt ? f.filedAt.toISOString() : null,
          acknowledgementNo: f.acknowledgementNo,
          refundStatus: f.refundStatus,
          assignedStaffId: f.assignedStaffId,
          assignedStaffName: f.assignedStaff?.name || null,
          createdAt: f.createdAt.toISOString(),
          updatedAt: f.updatedAt.toISOString()
        }));

        return formatPaginatedResponse(formatted, total, page, pageSize);
      } catch (err: any) {
        logger.warn({ err: err.message }, "ITR DB query failed, falling back to memoryClients");
      }
    }

    const inMemFilings = memoryClients
      .filter(c => c.status === "ACTIVE" && (c.workType?.includes("ITR") || c.workType === "Tax Audit"))
      .map(c => {
        const defaultDueDate = DueDateEngine.calculateItrDueDate({
          assessmentYear: "AY 2026-27",
          formType: c.entityType === "PVT_LTD" ? "ITR_6" : "ITR_3",
          isAuditRequired: c.entityType === "PVT_LTD" || c.workType === "Tax Audit"
        });
        return {
          id: `itr-${c.id}`,
          clientId: c.id,
          clientName: c.name,
          workType: c.workType || "ITR",
          assessmentYear: "AY 2026-27",
          itrFormType: (c.entityType === "PVT_LTD" ? "ITR_6" : "ITR_3") as ItrFormType,
          dueDate: defaultDueDate.toISOString().split("T")[0],
          status: "DOCUMENTS_PENDING" as ItrStatus,
          filedAt: null,
          acknowledgementNo: null,
          refundStatus: null,
          assignedStaffId: c.assignedStaffId || null,
          assignedStaffName: c.assignedStaffName || null,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt
        };
      });

    let filtered = inMemFilings;
    if (query.clientId) filtered = filtered.filter(f => f.clientId === query.clientId);
    if (query.status === "pending") {
      filtered = filtered.filter(f => ["NOT_STARTED", "DOCUMENTS_PENDING", "UNDER_PREPARATION", "FILED"].includes(f.status));
    } else if (status) {
      filtered = filtered.filter(f => f.status === status);
    }
    const paginated = filtered.slice(skip, skip + pageSize);
    return formatPaginatedResponse(paginated, filtered.length, page, pageSize);
  }

  public static async getFilingById(id: string, _user: AuthUser) {
    const filing = await prisma.itrFiling.findUnique({
      where: { id },
      include: { client: true, assignedStaff: true }
    });
    if (!filing) {
      throw new NotFoundError("ITR Filing not found");
    }
    return filing;
  }

  public static async createFiling(
    clientId: string,
    assessmentYear: string,
    itrFormType: ItrFormType,
    isAuditRequired: boolean,
    user: AuthUser
  ) {
    const dueDate = DueDateEngine.calculateItrDueDate({ assessmentYear, formType: itrFormType, isAuditRequired });
    const filing = await prisma.itrFiling.create({
      data: { clientId, assessmentYear, itrFormType, dueDate, status: "NOT_STARTED", assignedStaffId: user.id },
      include: { client: true, assignedStaff: true }
    });
    return filing;
  }

  public static async updateFilingStatus(
    id: string,
    newStatus: ItrStatus,
    metadata: { acknowledgementNo?: string; refundStatus?: string } = {},
    user: AuthUser
  ) {
    const updated = await prisma.itrFiling.update({
      where: { id },
      data: { status: newStatus as any, acknowledgementNo: metadata.acknowledgementNo, refundStatus: metadata.refundStatus }
    });

    eventBus.publish("ITR_STATUS_CHANGED", { clientId: updated.clientId, metadata: { status: newStatus } });
    return updated;
  }
}
