import { prisma, isDbCircuitOpen } from "../../lib/db";
import { scopeToAssignedClients } from "../../lib/permissions";
import { buildPaginationParams, formatPaginatedResponse } from "../../lib/utils";
import { eventBus } from "../../lib/event-bus";
import { DueDateEngine } from "../../lib/due-date-engine";
import { NotFoundError, ConflictError } from "../../middleware/errorHandler";
import { AuthUser, ClientDTO, ClientRecord } from "@ca-saas/shared-types";
import { logger } from "../../lib/logger";

const INITIAL_MEMORY_CLIENTS: ClientRecord[] = [
  {
    id: "mem-client-1",
    name: "Acme Logistics Pvt Ltd",
    pan: "AAACA1234A",
    gstin: "27AAACA1234A1Z5",
    entityType: "PVT_LTD",
    contactPhone: "+91 98765 43210",
    contactEmail: "accounts@acmelogistics.in",
    workType: "ITR + GST",
    assignedStaffId: "superadmin-seed-id",
    assignedStaffName: "Super Admin",
    status: "ACTIVE",
    complianceRisk: "LOW",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "mem-client-2",
    name: "Sharma & Associates LLP",
    pan: "AALFS5678B",
    gstin: "27AALFS5678B1Z2",
    entityType: "LLP",
    contactPhone: "+91 98234 56789",
    contactEmail: "tax@sharmallp.com",
    workType: "Tax Audit",
    assignedStaffId: "superadmin-seed-id",
    assignedStaffName: "Super Admin",
    status: "ACTIVE",
    complianceRisk: "LOW",
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "mem-client-3",
    name: "Priya Fashion Mart",
    pan: "BCDPP9012C",
    gstin: "27BCDPP9012C1Z8",
    entityType: "PROPRIETORSHIP",
    contactPhone: "+91 99887 76655",
    contactEmail: "priya@fashionmart.in",
    workType: "GST",
    assignedStaffId: "superadmin-seed-id",
    assignedStaffName: "Super Admin",
    status: "ACTIVE",
    complianceRisk: "LOW",
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export let memoryClients: ClientRecord[] = [...INITIAL_MEMORY_CLIENTS];

export class ClientsService {
  public static async listClients(user: AuthUser, query: Record<string, any>) {
    const { page, pageSize, skip } = buildPaginationParams(query);
    const search = (query.search as string || "").toLowerCase();

    if (!isDbCircuitOpen()) {
      try {
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
      } catch (err: any) {
        logger.warn({ err: err.message }, "Database query failed in listClients, using in-memory fallback");
      }
    }

    // In-memory fallback
    let filtered = [...memoryClients];
    if (query.status) {
      filtered = filtered.filter(c => c.status === query.status);
    }
    if (query.entityType) {
      filtered = filtered.filter(c => c.entityType === query.entityType);
    }
    if (query.workType) {
      if (query.workType === "ITR") {
        filtered = filtered.filter(c => c.workType === "ITR" || c.workType === "ITR + GST");
      } else if (query.workType === "GST") {
        filtered = filtered.filter(c => c.workType === "GST" || c.workType === "ITR + GST");
      } else {
        filtered = filtered.filter(c => c.workType === query.workType);
      }
    }
    if (search) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(search) ||
        c.pan.toLowerCase().includes(search) ||
        (c.gstin && c.gstin.toLowerCase().includes(search))
      );
    }

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + pageSize);
    return formatPaginatedResponse(paginated, total, page, pageSize);
  }

  public static async getClientById(id: string, user: AuthUser) {
    if (!isDbCircuitOpen()) {
      try {
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

        if (client) return client;
      } catch (err: any) {
        logger.warn({ err: err.message }, "Database query failed in getClientById, checking in-memory store");
      }
    }

    const memClient = memoryClients.find(c => c.id === id);
    if (!memClient) {
      throw new NotFoundError("Client not found");
    }
    return {
      ...memClient,
      assignedStaff: { id: user.id, name: user.name, email: user.email },
      documents: [],
      itrFilings: [],
      gstReturns: [],
      invoices: [],
      tasks: [],
      tdsTcsEntries: []
    };
  }

  public static async createClient(dto: ClientDTO, user: AuthUser) {
    const pan = dto.pan.trim().toUpperCase();
    const gstin = dto.gstin?.trim() ? dto.gstin.trim().toUpperCase() : null;

    // Check duplicates in in-memory store
    const dupInMemory = memoryClients.find(c => c.pan === pan || (gstin && c.gstin === gstin));
    if (dupInMemory) {
      throw new ConflictError(dupInMemory.pan === pan ? "A client with this PAN number already exists." : "A client with this GSTIN already exists.");
    }

    if (!isDbCircuitOpen()) {
      try {
        // Safely verify assigned staff exists in DB to prevent P2003 foreign key constraint violation
        let assignedStaffId: string | null = null;
        const targetStaffId = dto.assignedStaffId || user?.id;
        if (targetStaffId && targetStaffId !== "superadmin-seed-id") {
          try {
            const staffExists = await prisma.user.findUnique({
              where: { id: targetStaffId },
              select: { id: true }
            });
            if (staffExists) {
              assignedStaffId = staffExists.id;
            }
          } catch {
            assignedStaffId = null;
          }
        }

        const client = await prisma.client.create({
          data: {
            name: dto.name.trim(),
            pan,
            gstin,
            entityType: dto.entityType as any,
            contactPhone: dto.contactPhone.trim(),
            contactEmail: dto.contactEmail?.trim() ? dto.contactEmail.trim().toLowerCase() : null,
            workType: dto.workType || "ITR",
            assignedStaffId,
            status: dto.status || "ACTIVE"
          } as any
        });

        try {
          await ClientsService.syncClientFilings(client);
        } catch (syncErr) {
          // Non-fatal statutory sync failure should not block client creation
        }

        eventBus.publish("CLIENT_CREATED", { clientId: client.id });

        // Keep in-memory cache synchronized
        memoryClients.unshift({
          id: client.id,
          name: client.name,
          pan: client.pan,
          gstin: client.gstin,
          entityType: client.entityType as any,
          contactPhone: client.contactPhone,
          contactEmail: client.contactEmail,
          workType: client.workType || "ITR",
          assignedStaffId: client.assignedStaffId,
          assignedStaffName: user?.name || "Assigned CA",
          status: client.status as any,
          complianceRisk: "LOW",
          createdAt: client.createdAt.toISOString(),
          updatedAt: client.updatedAt.toISOString()
        });

        return client;
      } catch (err: any) {
        if (err instanceof ConflictError) throw err;
        if (err?.code === "P2002") {
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
        logger.warn({ err: err.message }, "Live database write failed in createClient; persisting to in-memory store");
      }
    }

    // In-memory fallback creation when database is offline/unreachable
    const inMemRecord: ClientRecord = {
      id: `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: dto.name.trim(),
      pan,
      gstin,
      entityType: dto.entityType as any,
      contactPhone: dto.contactPhone.trim(),
      contactEmail: dto.contactEmail?.trim() ? dto.contactEmail.trim().toLowerCase() : null,
      workType: dto.workType || "ITR",
      assignedStaffId: user.id || null,
      assignedStaffName: user.name || "Super Admin",
      status: (dto.status as any) || "ACTIVE",
      complianceRisk: "LOW",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    memoryClients.unshift(inMemRecord);
    eventBus.publish("CLIENT_CREATED", { clientId: inMemRecord.id });
    return inMemRecord;
  }

  public static async updateClient(id: string, dto: Partial<ClientDTO>, _user: AuthUser) {
    const inMemIndex = memoryClients.findIndex(c => c.id === id);

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name.trim();
    if (dto.entityType) updateData.entityType = dto.entityType as any;
    if (dto.pan) updateData.pan = dto.pan.trim().toUpperCase();
    if (dto.gstin !== undefined) updateData.gstin = dto.gstin?.trim() ? dto.gstin.trim().toUpperCase() : null;
    if (dto.status) updateData.status = dto.status as any;
    if (dto.workType) updateData.workType = dto.workType;
    if (dto.contactPhone) updateData.contactPhone = dto.contactPhone.trim();
    if (dto.contactEmail !== undefined) updateData.contactEmail = dto.contactEmail?.trim() ? dto.contactEmail.trim().toLowerCase() : null;
    if (dto.assignedStaffId !== undefined) {
      if (dto.assignedStaffId && dto.assignedStaffId !== "superadmin-seed-id") {
        try {
          const staffExists = await prisma.user.findUnique({
            where: { id: dto.assignedStaffId },
            select: { id: true }
          });
          updateData.assignedStaffId = staffExists ? staffExists.id : null;
        } catch {
          updateData.assignedStaffId = null;
        }
      } else {
        updateData.assignedStaffId = null;
      }
    }

    if (!isDbCircuitOpen()) {
      try {
        const existing = await prisma.client.findUnique({ where: { id } });
        if (existing) {
          const updated = await prisma.client.update({
            where: { id },
            data: updateData
          });

          try {
            await ClientsService.syncClientFilings(updated);
          } catch {}

          if (inMemIndex !== -1) {
            memoryClients[inMemIndex] = { ...memoryClients[inMemIndex], ...updateData, updatedAt: new Date().toISOString() };
          }
          return updated;
        }
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
        logger.warn({ err: err.message }, "Live database update failed; updating in-memory store");
      }
    }

    if (inMemIndex === -1) {
      throw new NotFoundError("Client not found");
    }

    memoryClients[inMemIndex] = {
      ...memoryClients[inMemIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    return memoryClients[inMemIndex];
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

        let staffForItr: string | null = null;
        if (client.assignedStaffId && client.assignedStaffId !== "superadmin-seed-id") {
          try {
            const userExists = await prisma.user.findUnique({
              where: { id: client.assignedStaffId },
              select: { id: true }
            });
            if (userExists) {
              staffForItr = userExists.id;
            }
          } catch {
            staffForItr = null;
          }
        }

        await prisma.itrFiling.create({
          data: {
            clientId: client.id,
            assessmentYear: "AY 2026-27",
            itrFormType: client.entityType === "PVT_LTD" ? "ITR_6" : "ITR_3",
            dueDate: defaultItrDueDate,
            status: "DOCUMENTS_PENDING",
            assignedStaffId: staffForItr
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
    if (!isDbCircuitOpen()) {
      try {
        const existing = await prisma.client.findUnique({ where: { id } });
        if (existing) {
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
        }
      } catch (err: any) {
        logger.warn({ err: err.message }, "Live database delete failed; removing from in-memory store");
      }
    }

    memoryClients = memoryClients.filter(c => c.id !== id);
    return { message: "Client deleted successfully" };
  }
}
