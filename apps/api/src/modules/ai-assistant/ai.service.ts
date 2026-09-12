import { prisma } from "../../lib/db";
import { OllamaProvider } from "../../adapters/OllamaProvider";
import { scopeToAssignedClients } from "../../lib/permissions";
import { AuthUser } from "@ca-saas/shared-types";
import { logger } from "../../lib/logger";

const aiProvider = new OllamaProvider();

export class AiService {
  /**
   * Hybrid Intent Router & RAG Execution
   */
  public static async processQuery(userQuery: string, user: AuthUser, conversationId?: string) {
    const qLower = userQuery.toLowerCase();
    const clientScope = scopeToAssignedClients(user, {});

    // 1. Structured Intent Detection
    if (qLower.includes("gst") && (qLower.includes("pending") || qLower.includes("due"))) {
      logger.info(`🤖 AI Hybrid Intent Detected: GST_PENDING for user ${user.email}`);
      const pendingGst = await prisma.gstReturn.findMany({
        where: {
          client: clientScope,
          status: { in: ["NOT_STARTED", "PENDING", "OVERDUE"] }
        },
        include: { client: { select: { name: true, gstin: true } } },
        take: 10
      });

      const responseText = pendingGst.length
        ? `Found ${pendingGst.length} pending GST return(s) authorized for your scope:\n` +
          pendingGst.map((g, i) => `${i + 1}. **${g.client.name}** (${g.returnType} - ${g.period}) Due: ${g.dueDate.toISOString().split("T")[0]} | Status: ${g.status}`).join("\n")
        : "No pending GST returns found for your assigned scope.";

      return {
        answer: responseText,
        sourceType: "structured",
        data: pendingGst
      };
    }

    if (qLower.includes("itr") && (qLower.includes("pending") || qLower.includes("due") || qLower.includes("status"))) {
      logger.info(`🤖 AI Hybrid Intent Detected: ITR_PENDING for user ${user.email}`);
      const pendingItr = await prisma.itrFiling.findMany({
        where: {
          client: clientScope,
          status: { in: ["NOT_STARTED", "DOCUMENTS_PENDING", "UNDER_PREPARATION"] }
        },
        include: { client: { select: { name: true, pan: true } } },
        take: 10
      });

      const responseText = pendingItr.length
        ? `Found ${pendingItr.length} pending ITR filing(s) for your scope:\n` +
          pendingItr.map((itr, i) => `${i + 1}. **${itr.client.name}** (${itr.assessmentYear} ${itr.itrFormType}) Due: ${itr.dueDate.toISOString().split("T")[0]} | Status: ${itr.status}`).join("\n")
        : "No pending ITR filings found for your scope.";

      return {
        answer: responseText,
        sourceType: "structured",
        data: pendingItr
      };
    }

    if (qLower.includes("overdue") || qLower.includes("invoice") || qLower.includes("unpaid")) {
      logger.info(`🤖 AI Hybrid Intent Detected: OVERDUE_INVOICES for user ${user.email}`);
      const overdueInvoices = await prisma.invoice.findMany({
        where: {
          client: clientScope,
          status: { in: ["SENT", "OVERDUE"] }
        },
        include: { client: { select: { name: true } } },
        take: 10
      });

      const responseText = overdueInvoices.length
        ? `Found ${overdueInvoices.length} outstanding/overdue invoice(s):\n` +
          overdueInvoices.map((inv, i) => `${i + 1}. **${inv.client.name}** (Invoice #${inv.invoiceNo}) Amount: ₹${inv.total} | Due: ${inv.dueDate.toISOString().split("T")[0]} | Status: ${inv.status}`).join("\n")
        : "All invoices are up to date and paid!";

      return {
        answer: responseText,
        sourceType: "structured",
        data: overdueInvoices
      };
    }

    if (qLower.includes("missing") && qLower.includes("document")) {
      logger.info(`🤖 AI Hybrid Intent Detected: MISSING_DOCUMENTS for user ${user.email}`);
      const clients = await prisma.client.findMany({
        where: clientScope,
        include: { documents: true },
        take: 10
      });

      const missingList: string[] = [];
      clients.forEach(c => {
        const types = c.documents.map(d => d.docType);
        if (!types.includes("PAN")) missingList.push(`• **${c.name}**: Missing PAN`);
        if (!types.includes("BANK_STATEMENT")) missingList.push(`• **${c.name}**: Missing Bank Statement`);
      });

      return {
        answer: missingList.length
          ? `Missing document audit results:\n${missingList.join("\n")}`
          : "All clients have submitted required baseline documents.",
        sourceType: "structured",
        data: missingList
      };
    }

    // 2. Open-ended Contextual RAG + Ollama Generation
    logger.info(`🤖 AI RAG Execution for: "${userQuery}"`);
    const clientsData = await prisma.client.findMany({
      where: clientScope,
      select: { name: true, pan: true, gstin: true, entityType: true, status: true },
      take: 5
    });

    const contextStr = clientsData.map(c => `Client: ${c.name}, PAN: ${c.pan}, GSTIN: ${c.gstin || "N/A"}, Entity: ${c.entityType}, Status: ${c.status}`).join("\n");

    const answer = await aiProvider.generateChatCompletion([
      {
        role: "system",
        content: `You are an AI assistant for a Chartered Accountant firm. Answer based strictly on authorized client records context below.\n\nContext:\n${contextStr}`
      },
      {
        role: "user",
        content: userQuery
      }
    ]);

    return {
      answer,
      sourceType: "rag",
      data: null
    };
  }

  public static async getConversations(userId: string) {
    return prisma.aiConversation.findMany({
      where: { userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" }
    });
  }
}
