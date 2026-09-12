import { prisma } from "../../lib/db";
import { WhatsAppProviderFactory } from "../../adapters/WhatsAppProvider";
import { scopeToAssignedClients } from "../../lib/permissions";
import { buildPaginationParams, formatPaginatedResponse } from "../../lib/utils";
import { NotFoundError } from "../../middleware/errorHandler";
import { AuthUser } from "@ca-saas/shared-types";

const whatsappProvider = WhatsAppProviderFactory.getProvider();

export class WhatsAppService {
  public static async listMessages(user: AuthUser, query: Record<string, any>) {
    const { page, pageSize, skip } = buildPaginationParams(query);
    const clientId = query.clientId as string;

    const clientScope = scopeToAssignedClients(user, {});
    const whereCondition: any = { client: clientScope };
    if (clientId) whereCondition.clientId = clientId;

    const [messages, total] = await Promise.all([
      prisma.whatsAppMessage.findMany({
        where: whereCondition,
        include: { client: { select: { id: true, name: true } } },
        skip,
        take: pageSize,
        orderBy: { sentAt: "desc" }
      }),
      prisma.whatsAppMessage.count({ where: whereCondition })
    ]);

    const formatted = messages.map(m => ({
      id: m.id,
      clientId: m.clientId,
      clientName: m.client.name,
      templateId: m.templateId,
      direction: m.direction,
      body: m.body,
      status: m.status,
      cost: m.cost,
      sentAt: m.sentAt.toISOString()
    }));

    return formatPaginatedResponse(formatted, total, page, pageSize);
  }

  public static async getMonthlySpend() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

    const result = await prisma.whatsAppMessage.aggregate({
      where: {
        sentAt: { gte: firstDay },
        direction: "OUTBOUND"
      },
      _sum: { cost: true },
      _count: { id: true }
    });

    const categoryBreakdown = await prisma.whatsAppMessage.groupBy({
      by: ["direction", "status"],
      where: { sentAt: { gte: firstDay } },
      _count: { id: true },
      _sum: { cost: true }
    });

    return {
      month: now.toLocaleString("default", { month: "long", year: "numeric" }),
      totalSpend: result._sum.cost || 0,
      totalSent: result._count.id || 0,
      categoryBreakdown
    };
  }

  public static async listTemplates() {
    return prisma.whatsAppTemplate.findMany({
      orderBy: { createdAt: "desc" }
    });
  }

  public static async createTemplate(name: string, category: any, body: string, variables: string[], user: AuthUser) {
    const template = await prisma.whatsAppTemplate.create({
      data: {
        name,
        category: category || "UTILITY",
        body,
        variables,
        approvalStatus: "APPROVED"
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "WHATSAPP_TEMPLATE_CREATED",
        entityType: "WhatsAppTemplate",
        entityId: template.id,
        after: { name, category }
      }
    });

    return template;
  }

  public static async sendTemplateMessage(
    clientId: string,
    templateName: string,
    variables: Record<string, string>,
    user: AuthUser
  ) {
    const clientScope = scopeToAssignedClients(user, { id: clientId });
    const client = await prisma.client.findFirst({ where: clientScope });
    if (!client) throw new NotFoundError("Client not found");

    const template = await prisma.whatsAppTemplate.findUnique({ where: { name: templateName } });
    let messageBody = template ? template.body : `Template message to ${client.name}`;

    if (template && variables) {
      Object.entries(variables).forEach(([key, val]) => {
        messageBody = messageBody.replace(new RegExp(`{{${key}}}`, "g"), val);
      });
    }

    const result = await whatsappProvider.sendMessage({
      clientId: client.id,
      phone: client.contactPhone,
      message: messageBody,
      templateName
    });

    const recordedMessage = await prisma.whatsAppMessage.create({
      data: {
        clientId: client.id,
        templateId: template?.id || null,
        direction: "OUTBOUND",
        body: messageBody,
        status: result.success ? "SENT" : "FAILED",
        cost: result.cost
      }
    });

    return recordedMessage;
  }
}
