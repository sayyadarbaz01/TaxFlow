import { prisma } from "../../lib/db";
import { scopeToAssignedClients } from "../../lib/permissions";
import { buildPaginationParams, formatPaginatedResponse } from "../../lib/utils";
import { eventBus } from "../../lib/event-bus";
import { DueDateEngine } from "../../lib/due-date-engine";
import { NotFoundError, ConflictError } from "../../middleware/errorHandler";
import { AuthUser, ClientDTO, ClientRecord } from "@ca-saas/shared-types";

export class ClientsService {
  public static async listClients(user: AuthUser, query: Record<string, any>) {
    const { page, pageSize, skip } = buildPaginationParams(query);
    const search = query.search as string;

    const whereCondition: any = scopeToAssignedClients(user, {});
    if (query.status) {
      whereCondition.status = query.status;
    }
    if (query.entityType) {
      whereCondition.entityType = query.entityType;
    }
    if (query.workType) {
      if (query.workType === "ITR") {
        whereCondition.workType = { in: ["ITR", "ITR + GST"] };
      } else if (query.workType === "GST") {
        whereCondition.workType = { in: ["GST", "ITR + GST"] };
      } else {
        whereCondition.workType = query.workType;
      }
    }
    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { pan: { contains: search, mode: "insensitive" } }
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where: whereCondition,
        include: { assignedStaff: { select: { id: true, name: true } } },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" }
      }),
      prisma.client.count({ where: whereCondition })
    ]);

    const formatted: ClientRecord[] = clients.map((c: any) => ({
      id: c.id,
      name: c.name,
      pan: c.pan,
      gstin: c.gstin,
      entityType: c.entityType as any,
      contactPhone: c.contactPhone,
      contactEmail: c.contactEmail || null,
      workType: c.workType || "ITR",
      assignedStaffId: c.assignedStaffId,
      assignedStaffName: c.assignedStaff?.name || null,
      status: c.status as any,
      complianceRisk: "LOW",
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString()
    }));

    return formatPaginatedResponse(formatted, total, page, pageSize);
  }

  public static async getClientById(id: string, user: AuthUser) {
    const whereCondition = scopeToAssignedClients(user, { id });
    const client = await prisma.client.findFirst({
      where: whereCondition,
      include: {
        assignedStaff: { select: { id: true, name: true, email: true } },
        documents: true,
        itrFilings: true,
        gstReturns: true,
        invoices: true,
        tasks: true,
        tdsTcsEntries: true
      }
    });

    if (!client) {
      throw new NotFoundError("Client not found");
    }

    return client;
  }

  public static async createClient(dto: ClientDTO, user: AuthUser) {
    const client = await prisma.client.create({
      data: {
        name: dto.name,
        pan: dto.pan,
        gstin: dto.gstin || null,
        entityType: dto.entityType as any,
        contactPhone: dto.contactPhone,
        contactEmail: dto.contactEmail || null,
        workType: dto.workType || "ITR",
        assignedStaffId: dto.assignedStaffId || user.id,
        status: dto.status || "ACTIVE"
      } as any
    });

    await ClientsService.syncClientFilings(client);
    eventBus.publish("CLIENT_CREATED", { clientId: client.id });
    return client;
  }

  public static async updateClient(id: string, dto: Partial<ClientDTO>, _user: AuthUser) {
    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("Client not found");
    }

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name.trim();
    if (dto.entityType) updateData.entityType = dto.entityType as any;
    if (dto.pan) updateData.pan = dto.pan.trim().toUpperCase();
    if (dto.gstin !== undefined) updateData.gstin = dto.gstin?.trim() ? dto.gstin.trim().toUpperCase() : null;
    if (dto.status) updateData.status = dto.status as any;
    if (dto.workType) updateData.workType = dto.workType;
    if (dto.contactPhone) updateData.contactPhone = dto.contactPhone.trim();
    if (dto.contactEmail !== undefined) updateData.contactEmail = dto.contactEmail?.trim() ? dto.contactEmail.trim().toLowerCase() : null;
    if (dto.assignedStaffId !== undefined) updateData.assignedStaffId = dto.assignedStaffId ? dto.assignedStaffId : null;

    try {
      const updated = await prisma.client.update({
        where: { id },
        data: updateData
      });

      await ClientsService.syncClientFilings(updated);
      return updated;
    } catch (err: any) {
      if (err.code === "P2002") {
        const target = err.meta?.target;
        const targetStr = Array.isArray(target) ? target.join(",") : String(target || "");
        if (targetStr.includes("pan")) {
          throw new ConflictError("A client with this PAN number already exists.");
        }
        if (targetStr.includes("gstin")) {
          throw new ConflictError("A client with this GSTIN already exists.");
        }
        throw new ConflictError("A client with matching unique identifiers (PAN or GSTIN) already exists.");
      }
      throw err;
    }
  }

  public static async syncClientFilings(client: any) {
    // Leads are prospective inquiries and do not have statutory filings until converted to active
    if (client.status === "LEAD") {
      return;
    }

    const workType = client.workType || "ITR";

    // 1. If workType includes ITR (ITR, ITR + GST, or Tax Audit), ensure ItrFiling exists
    if (["ITR", "ITR + GST", "Tax Audit"].includes(workType)) {
      const existingItr = await prisma.itrFiling.findFirst({
        where: { clientId: client.id, assessmentYear: "AY 2026-27" }
      });
      if (!existingItr) {
        const defaultItrDueDate = DueDateEngine.calculateItrDueDate({
          assessmentYear: "AY 2026-27",
          formType: client.entityType === "PVT_LTD" ? "ITR_6" : "ITR_3",
          isAuditRequired: client.entityType === "PVT_LTD" || workType === "Tax Audit"
        });
        await prisma.itrFiling.create({
          data: {
            clientId: client.id,
            assessmentYear: "AY 2026-27",
            itrFormType: client.entityType === "PVT_LTD" ? "ITR_6" : "ITR_3",
            dueDate: defaultItrDueDate,
            status: "DOCUMENTS_PENDING",
            assignedStaffId: client.assignedStaffId || null
          }
        });
      }
    }

    // 2. If workType includes GST (GST or ITR + GST), ensure GstReturn exists
    if (["GST", "ITR + GST"].includes(workType)) {
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
    }
  }

  public static async deleteClient(id: string, _user: AuthUser) {
    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("Client not found");
    }

    try {
      await prisma.client.delete({ where: { id } });
    } catch (err) {
      // Fallback in case of foreign key constraints
      await Promise.all([
        prisma.clientDocument.deleteMany({ where: { clientId: id } }),
        prisma.itrFiling.deleteMany({ where: { clientId: id } }),
        prisma.gstReturn.deleteMany({ where: { clientId: id } }),
        prisma.tdsTcsEntry.deleteMany({ where: { clientId: id } }),
        prisma.task.deleteMany({ where: { clientId: id } }),
        prisma.whatsAppMessage.deleteMany({ where: { clientId: id } })
      ]);
      await prisma.client.delete({ where: { id } });
    }

    return { message: "Client deleted successfully" };
  }
}
