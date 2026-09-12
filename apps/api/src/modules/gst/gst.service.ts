import { prisma } from "../../lib/db";
import { scopeToAssignedClients } from "../../lib/permissions";
import { buildPaginationParams, formatPaginatedResponse } from "../../lib/utils";
import { DueDateEngine } from "../../lib/due-date-engine";
import { NotFoundError } from "../../middleware/errorHandler";
import { AuthUser, GstReturnType, GstFilingFrequency } from "@ca-saas/shared-types";

export class GstService {
  public static async listReturns(user: AuthUser, query: Record<string, any>) {
    const { page, pageSize, skip } = buildPaginationParams(query);
    const returnType = query.returnType as GstReturnType;

    const clientScope = scopeToAssignedClients(user, {});
    const whereCondition: any = { client: clientScope };
    if (query.clientId) whereCondition.clientId = query.clientId;
    if (returnType) whereCondition.returnType = returnType;
    if (query.status === "due") {
      const today = new Date();
      const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000 - 1);
      whereCondition.status = { not: "FILED" };
      whereCondition.dueDate = { lte: in7Days };
    } else if (query.status) {
      whereCondition.status = query.status;
    }

    const [returns, total] = await Promise.all([
      prisma.gstReturn.findMany({
        where: whereCondition,
        include: { client: { select: { id: true, name: true, gstin: true, workType: true } } },
        skip,
        take: pageSize,
        orderBy: { dueDate: "asc" }
      }),
      prisma.gstReturn.count({ where: whereCondition })
    ]);

    const formatted = returns.map((r: any) => ({
      id: r.id,
      clientId: r.clientId,
      clientName: r.client.name,
      workType: r.client.workType || "GST",
      returnType: r.returnType,
      period: r.period,
      filingFrequency: r.filingFrequency,
      dueDate: r.dueDate.toISOString().split("T")[0],
      status: r.status,
      filedAt: r.filedAt ? r.filedAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    }));

    return formatPaginatedResponse(formatted, total, page, pageSize);
  }

  public static async getUpcomingDue(user: AuthUser) {
    const clientScope = scopeToAssignedClients(user, {});
    const upcomingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const returns = await prisma.gstReturn.findMany({
      where: {
        client: clientScope,
        status: { in: ["NOT_STARTED", "PENDING", "OVERDUE"] },
        dueDate: { lte: upcomingDate }
      },
      include: { client: { select: { id: true, name: true, gstin: true } } },
      orderBy: { dueDate: "asc" }
    });

    return returns.map((r: any) => ({
      id: r.id,
      clientId: r.clientId,
      clientName: r.client.name,
      gstin: r.client.gstin,
      returnType: r.returnType,
      period: r.period,
      dueDate: r.dueDate.toISOString().split("T")[0],
      status: r.status
    }));
  }

  public static async createReturn(
    clientId: string,
    returnType: GstReturnType,
    period: string,
    filingFrequency: GstFilingFrequency,
    _user: AuthUser
  ) {
    const dueDate = DueDateEngine.calculateGstDueDate({ returnType, period, frequency: filingFrequency });

    return prisma.gstReturn.create({
      data: {
        clientId,
        returnType,
        period,
        filingFrequency,
        dueDate,
        status: "PENDING"
      }
    });
  }

  public static async markFiled(id: string, _user: AuthUser) {
    const existing = await prisma.gstReturn.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("GST return not found");
    }

    return prisma.gstReturn.update({
      where: { id },
      data: { status: "FILED", filedAt: new Date() }
    });
  }
}
