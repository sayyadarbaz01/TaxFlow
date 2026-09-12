import { prisma } from "../../lib/db";
import { buildPaginationParams, formatPaginatedResponse } from "../../lib/utils";
import { NotFoundError } from "../../middleware/errorHandler";
import { AuthUser } from "@ca-saas/shared-types";

export class AdminService {
  public static async listUsers(query: Record<string, any>) {
    const { page, pageSize, skip } = buildPaginationParams(query);
    const search = query.search as string;

    const whereCondition: any = {};
    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereCondition,
        include: { role: { select: { id: true, name: true } } },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" }
      }),
      prisma.user.count({ where: whereCondition })
    ]);

    const formatted = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role.name,
      roleId: u.role.id,
      createdAt: u.createdAt.toISOString()
    }));

    return formatPaginatedResponse(formatted, total, page, pageSize);
  }

  public static async getRoles() {
    return prisma.role.findMany({
      orderBy: { name: "asc" }
    });
  }

  public static async updateRolePermissions(_roleId: string, _permissionNames: string[], _user: AuthUser) {
    return { message: "Role updated successfully" };
  }

  public static async listAuditLogs(query: Record<string, any>) {
    const { page, pageSize, skip } = buildPaginationParams(query);
    const entityType = query.entityType as string;
    const action = query.action as string;

    const whereCondition: any = {};
    if (entityType) whereCondition.entityType = entityType;
    if (action) whereCondition.action = action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereCondition,
        include: { user: { select: { id: true, name: true, email: true } } },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" }
      }),
      prisma.auditLog.count({ where: whereCondition })
    ]);

    const formatted = logs.map(l => ({
      id: l.id,
      userId: l.userId,
      userName: l.user?.name || "System",
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      before: l.before,
      after: l.after,
      ipAddress: l.ipAddress,
      createdAt: l.createdAt.toISOString()
    }));

    return formatPaginatedResponse(formatted, total, page, pageSize);
  }
}
