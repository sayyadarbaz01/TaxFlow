import { prisma, isDbCircuitOpen } from "../../lib/db";
import { NotFoundError, ValidationError } from "../../middleware/errorHandler";
import {
  AuthUser,
  ClientServiceDTO,
  ClientServiceRecord,
  ServiceType,
  ServicePaymentStatus,
  ServiceWorkStatus
} from "@ca-saas/shared-types";
import { logger } from "../../lib/logger";

export const memoryClientServices: ClientServiceRecord[] = [];

const VALID_ITR_FORMS = ["ITR_1", "ITR_2", "ITR_3", "ITR_4", "ITR_5", "ITR_6", "ITR_7"];

export class ClientServicesService {
  public static async listServices(clientId: string, _user: AuthUser): Promise<ClientServiceRecord[]> {
    if (!isDbCircuitOpen()) {
      try {
        const services = await prisma.clientService.findMany({
          where: { clientId },
          orderBy: { createdAt: "asc" }
        });

        return services.map(s => ({
          id: s.id,
          clientId: s.clientId,
          serviceType: s.serviceType as ServiceType,
          serviceName: s.serviceName,
          fee: s.fee,
          paymentStatus: s.paymentStatus as ServicePaymentStatus,
          workStatus: s.workStatus as ServiceWorkStatus,
          serviceData: s.serviceData as Record<string, any> | null,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString()
        }));
      } catch (err: any) {
        logger.warn({ err: err.message }, "Database query failed in listServices, using in-memory fallback");
      }
    }

    return memoryClientServices.filter(s => s.clientId === clientId);
  }

  public static async getServiceById(clientId: string, serviceId: string, _user: AuthUser): Promise<ClientServiceRecord> {
    if (!isDbCircuitOpen()) {
      try {
        const service = await prisma.clientService.findFirst({
          where: { id: serviceId, clientId }
        });
        if (service) {
          return {
            id: service.id,
            clientId: service.clientId,
            serviceType: service.serviceType as ServiceType,
            serviceName: service.serviceName,
            fee: service.fee,
            paymentStatus: service.paymentStatus as ServicePaymentStatus,
            workStatus: service.workStatus as ServiceWorkStatus,
            serviceData: service.serviceData as Record<string, any> | null,
            createdAt: service.createdAt.toISOString(),
            updatedAt: service.updatedAt.toISOString()
          };
        }
      } catch (err: any) {
        logger.warn({ err: err.message }, "Database query failed in getServiceById, checking in-memory fallback");
      }
    }

    const memService = memoryClientServices.find(s => s.id === serviceId && s.clientId === clientId);
    if (!memService) {
      throw new NotFoundError("Client service not found");
    }
    return memService;
  }

  public static async createService(clientId: string, dto: ClientServiceDTO, _user: AuthUser): Promise<ClientServiceRecord> {
    // 1. Check if client exists
    if (!isDbCircuitOpen()) {
      try {
        const client = await prisma.client.findUnique({ where: { id: clientId } });
        if (!client) {
          throw new NotFoundError("Client not found");
        }
      } catch (err: any) {
        if (err instanceof NotFoundError) throw err;
      }
    }

    // 2. Validate and enrich service data based on serviceType
    const serviceData = { ...(dto.serviceData || {}) };
    let defaultServiceName = dto.serviceName;

    if (dto.serviceType === "INCOME_TAX_RETURN") {
      let formType = serviceData.itrFormType ? String(serviceData.itrFormType).replace("-", "_").toUpperCase() : "ITR_1";
      if (!VALID_ITR_FORMS.includes(formType)) {
        throw new ValidationError(`Invalid ITR Form: ${serviceData.itrFormType}. Must be one of: ITR-1, ITR-2, ITR-3, ITR-4, ITR-5, ITR-6, ITR-7.`);
      }
      serviceData.itrFormType = formType;
      serviceData.assessmentYear = serviceData.assessmentYear || "AY 2026-27";
      if (!defaultServiceName) {
        defaultServiceName = `Income Tax Return (${formType.replace("_", "-")})`;
      }
    } else if (dto.serviceType === "GST_RETURN") {
      serviceData.returnType = serviceData.returnType ? String(serviceData.returnType).replace("-", "").toUpperCase() : "GSTR3B";
      serviceData.period = serviceData.period || "Current Period";
      if (!defaultServiceName) {
        defaultServiceName = `GST Return (${serviceData.returnType} - ${serviceData.period})`;
      }
    } else if (dto.serviceType === "GST_REGISTRATION") {
      serviceData.registrationType = serviceData.registrationType || "REGULAR";
      serviceData.state = serviceData.state || "Maharashtra (27)";
      if (!defaultServiceName) {
        defaultServiceName = `GST Registration (${serviceData.registrationType})`;
      }
    }

    const fee = typeof dto.fee === "number" ? Math.max(0, dto.fee) : 0;
    const paymentStatus = dto.paymentStatus || "PENDING";
    const workStatus = dto.workStatus || "NOT_STARTED";

    if (!isDbCircuitOpen()) {
      try {
        const created = await prisma.clientService.create({
          data: {
            clientId,
            serviceType: dto.serviceType,
            serviceName: defaultServiceName,
            fee,
            paymentStatus,
            workStatus,
            serviceData
          }
        });

        const record: ClientServiceRecord = {
          id: created.id,
          clientId: created.clientId,
          serviceType: created.serviceType as ServiceType,
          serviceName: created.serviceName,
          fee: created.fee,
          paymentStatus: created.paymentStatus as ServicePaymentStatus,
          workStatus: created.workStatus as ServiceWorkStatus,
          serviceData: created.serviceData as Record<string, any> | null,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString()
        };

        memoryClientServices.push(record);
        return record;
      } catch (err: any) {
        logger.warn({ err: err.message }, "Database write failed in createService, persisting to in-memory store");
      }
    }

    // In-memory fallback
    const memRecord: ClientServiceRecord = {
      id: `svc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      clientId,
      serviceType: dto.serviceType,
      serviceName: defaultServiceName,
      fee,
      paymentStatus,
      workStatus,
      serviceData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    memoryClientServices.push(memRecord);
    return memRecord;
  }

  public static async updateService(
    clientId: string,
    serviceId: string,
    dto: Partial<ClientServiceDTO>,
    _user: AuthUser
  ): Promise<ClientServiceRecord> {
    const memIndex = memoryClientServices.findIndex(s => s.id === serviceId && s.clientId === clientId);

    const updateData: any = {};
    if (dto.serviceName !== undefined) updateData.serviceName = dto.serviceName;
    if (dto.fee !== undefined) updateData.fee = Math.max(0, dto.fee);
    if (dto.paymentStatus !== undefined) updateData.paymentStatus = dto.paymentStatus;
    if (dto.workStatus !== undefined) updateData.workStatus = dto.workStatus;
    if (dto.serviceData !== undefined) {
      if (dto.serviceData) {
        if (dto.serviceType === "INCOME_TAX_RETURN" || memIndex !== -1 && memoryClientServices[memIndex]?.serviceType === "INCOME_TAX_RETURN") {
          if (dto.serviceData.itrFormType) {
            const form = String(dto.serviceData.itrFormType).replace("-", "_").toUpperCase();
            if (!VALID_ITR_FORMS.includes(form)) {
              throw new ValidationError(`Invalid ITR Form: ${dto.serviceData.itrFormType}. Must be one of: ITR-1 to ITR-7.`);
            }
            dto.serviceData.itrFormType = form;
          }
        }
      }
      updateData.serviceData = dto.serviceData;
    }

    if (!isDbCircuitOpen()) {
      try {
        const existing = await prisma.clientService.findFirst({
          where: { id: serviceId, clientId }
        });
        if (existing) {
          const mergedData = dto.serviceData ? { ...(existing.serviceData as any || {}), ...dto.serviceData } : undefined;
          const updated = await prisma.clientService.update({
            where: { id: serviceId },
            data: {
              ...updateData,
              ...(mergedData ? { serviceData: mergedData } : {})
            }
          });

          const record: ClientServiceRecord = {
            id: updated.id,
            clientId: updated.clientId,
            serviceType: updated.serviceType as ServiceType,
            serviceName: updated.serviceName,
            fee: updated.fee,
            paymentStatus: updated.paymentStatus as ServicePaymentStatus,
            workStatus: updated.workStatus as ServiceWorkStatus,
            serviceData: updated.serviceData as Record<string, any> | null,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString()
          };

          if (memIndex !== -1) {
            memoryClientServices[memIndex] = record;
          }
          return record;
        }
      } catch (err: any) {
        logger.warn({ err: err.message }, "Database update failed in updateService, updating in-memory store");
      }
    }

    if (memIndex === -1) {
      throw new NotFoundError("Client service not found");
    }

    memoryClientServices[memIndex] = {
      ...memoryClientServices[memIndex],
      ...updateData,
      serviceData: dto.serviceData ? { ...(memoryClientServices[memIndex].serviceData || {}), ...dto.serviceData } : memoryClientServices[memIndex].serviceData,
      updatedAt: new Date().toISOString()
    };

    return memoryClientServices[memIndex];
  }

  public static async deleteService(clientId: string, serviceId: string, _user: AuthUser): Promise<{ success: boolean; message: string }> {
    const memIndex = memoryClientServices.findIndex(s => s.id === serviceId && s.clientId === clientId);

    if (!isDbCircuitOpen()) {
      try {
        const existing = await prisma.clientService.findFirst({
          where: { id: serviceId, clientId }
        });
        if (existing) {
          await prisma.clientService.delete({ where: { id: serviceId } });
          if (memIndex !== -1) {
            memoryClientServices.splice(memIndex, 1);
          }
          return { success: true, message: "Client service deleted successfully" };
        }
      } catch (err: any) {
        logger.warn({ err: err.message }, "Database delete failed in deleteService");
      }
    }

    if (memIndex === -1) {
      throw new NotFoundError("Client service not found");
    }

    memoryClientServices.splice(memIndex, 1);
    return { success: true, message: "Client service deleted successfully" };
  }
}
