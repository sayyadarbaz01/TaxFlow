import { AuthUser } from "@ca-saas/shared-types";
import { prisma } from "../../lib/db";
import { scopeToAssignedClients } from "../../lib/permissions";
import { logger } from "../../lib/logger";
import { createAiProvider } from "../../adapters/GeminiProvider";
import { AiSourceCitation } from "../../adapters/IAiProvider";
import { AppError, ValidationError } from "../../middleware/errorHandler";
import {
  CA_SYSTEM_PROMPT,
  PRACTICE_CONTEXT_PREAMBLE,
  KNOWLEDGE_CONTEXT_NOTE,
  shouldUseGrounding,
  isPracticeDataQuery
} from "./ai.prompts";
import { buildPracticeContext, resolveClientIdFromQuery } from "./ai.context";

const aiProvider = createAiProvider();

const MAX_QUERY_LENGTH = 2000;

export type AiSourceType = "structured" | "gemini" | "grounded" | "fallback";

export interface AiQueryResult {
  answer: string;
  sourceType: AiSourceType;
  sources: AiSourceCitation[];
  lastUpdated?: string | null;
  suggestedActions: string[];
  conversationId: string;
  data?: unknown;
  model?: string;
}

function sanitizeQuery(raw: string): string {
  const cleaned = raw.replace(/[\u0000-\u001F\u007F]/g, " ").trim();
  if (!cleaned) throw new ValidationError("query string is required");
  if (cleaned.length > MAX_QUERY_LENGTH) {
    throw new ValidationError(`query must be at most ${MAX_QUERY_LENGTH} characters`);
  }
  return cleaned;
}

function defaultSuggestedActions(stats: {
  pendingGst: number;
  pendingItr: number;
  overdueInvoices: number;
  missingDocsApprox: number;
}): string[] {
  const actions: string[] = [];
  if (stats.pendingGst > 0) actions.push("Review GST returns due this month");
  if (stats.pendingItr > 0) actions.push("Follow up on pending ITR filings");
  if (stats.overdueInvoices > 0) actions.push("Chase outstanding invoice payments");
  if (stats.missingDocsApprox > 0) actions.push("Request missing client documents");
  if (!actions.length) actions.push("Scan compliance dashboard for upcoming deadlines");
  return actions.slice(0, 4);
}

async function ensureConversation(userId: string, conversationId: string | undefined, title: string) {
  if (conversationId) {
    const existing = await prisma.aiConversation.findFirst({
      where: { id: conversationId, userId }
    });
    if (existing) return existing;
  }

  return prisma.aiConversation.create({
    data: {
      userId,
      title: title.slice(0, 80)
    }
  });
}

async function persistTurn(
  conversationId: string,
  userContent: string,
  assistantContent: string,
  sourceType: AiSourceType
) {
  await prisma.aiMessage.createMany({
    data: [
      { conversationId, role: "user", content: userContent, sourceType: null },
      { conversationId, role: "assistant", content: assistantContent, sourceType }
    ]
  });
}

async function auditAiRequest(
  user: AuthUser,
  conversationId: string,
  meta: { sourceType: string; queryLength: number; grounded: boolean }
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "AI_QUERY",
        entityType: "AiConversation",
        entityId: conversationId,
        after: {
          sourceType: meta.sourceType,
          queryLength: meta.queryLength,
          grounded: meta.grounded
        }
      }
    });
  } catch (err) {
    logger.warn({ err }, "Failed to write AI audit log");
  }
}

export class AiService {
  /**
   * Hybrid assistant:
   * 1) Fast structured answers for common practice queries (RBAC-scoped DB)
   * 2) Gemini for explanations / NL questions, with optional Google Search grounding
   */
  public static async processQuery(
    rawQuery: string,
    user: AuthUser,
    conversationId?: string,
    clientId?: string
  ): Promise<AiQueryResult> {
    const userQuery = sanitizeQuery(rawQuery);
    const qLower = userQuery.toLowerCase();
    const clientScope = scopeToAssignedClients(user, {});

    const conversation = await ensureConversation(user.id, conversationId, userQuery);

    // --- Structured intents (no LLM, authoritative practice data) ---
    if (
      (qLower.includes("gst") &&
        (qLower.includes("pending") ||
          qLower.includes("due") ||
          qLower.includes("this month") ||
          qLower.includes("compliance"))) ||
      qLower.includes("gst returns due")
    ) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const pendingGst = await prisma.gstReturn.findMany({
        where: {
          client: clientScope,
          status: { in: ["NOT_STARTED", "PENDING", "OVERDUE"] },
          ...(qLower.includes("this month")
            ? { dueDate: { gte: monthStart, lte: monthEnd } }
            : {})
        },
        include: { client: { select: { name: true, gstin: true } } },
        take: 25,
        orderBy: { dueDate: "asc" }
      });

      const answer = pendingGst.length
        ? `Found **${pendingGst.length}** pending GST return(s) in your authorized scope:\n\n` +
          pendingGst
            .map(
              (g, i) =>
                `${i + 1}. **${g.client.name}** — ${g.returnType} (${g.period}) · Due ${g.dueDate.toISOString().slice(0, 10)} · ${g.status}`
            )
            .join("\n") +
          `\n\n_Suggested next action:_ Open GST Returns and assign overdue items to staff.`
        : "No pending GST returns found for your assigned scope.";

      await persistTurn(conversation.id, userQuery, answer, "structured");
      await auditAiRequest(user, conversation.id, {
        sourceType: "structured",
        queryLength: userQuery.length,
        grounded: false
      });

      return {
        answer,
        sourceType: "structured",
        sources: [],
        lastUpdated: new Date().toISOString(),
        suggestedActions: ["Open GST Returns", "Message clients with pending returns"],
        conversationId: conversation.id,
        data: pendingGst
      };
    }

    if (
      qLower.includes("itr") &&
      (qLower.includes("pending") ||
        qLower.includes("status") ||
        qLower.includes("summarize") ||
        qLower.includes("summary") ||
        qLower.includes("open") ||
        qLower.includes("filing") ||
        qLower.includes("filings"))
    ) {
      const resolvedClientId =
        clientId || (await resolveClientIdFromQuery(user, userQuery));

      const filings = await prisma.itrFiling.findMany({
        where: {
          client: resolvedClientId
            ? scopeToAssignedClients(user, { id: resolvedClientId })
            : clientScope,
          ...(qLower.includes("pending")
            ? {
                status: {
                  in: ["NOT_STARTED", "DOCUMENTS_PENDING", "UNDER_PREPARATION"]
                }
              }
            : {})
        },
        include: { client: { select: { name: true, pan: true } } },
        take: 25,
        orderBy: { dueDate: "asc" }
      });

      const answer = filings.length
        ? `ITR status for your authorized scope (${filings.length}):\n\n` +
          filings
            .map(
              (f, i) =>
                `${i + 1}. **${f.client.name}** — AY ${f.assessmentYear} · ${f.itrFormType} · Due ${f.dueDate.toISOString().slice(0, 10)} · **${f.status}**`
            )
            .join("\n")
        : "No pending ITR filings in your workspace yet.\n\nAdd clients and create ITR records under **ITR Filings** to track status here.";

      await persistTurn(conversation.id, userQuery, answer, "structured");
      await auditAiRequest(user, conversation.id, {
        sourceType: "structured",
        queryLength: userQuery.length,
        grounded: false
      });

      return {
        answer,
        sourceType: "structured",
        sources: [],
        lastUpdated: new Date().toISOString(),
        suggestedActions: filings.length
          ? ["Open ITR Filings", "Request missing ITR documents"]
          : ["Add a client", "Create an ITR filing"],
        conversationId: conversation.id,
        data: filings
      };
    }

    if (
      qLower.includes("missing") &&
      (qLower.includes("document") || qLower.includes("doc") || qLower.includes("pan"))
    ) {
      const docs = await prisma.clientDocument.findMany({
        where: {
          client: clientScope,
          status: { in: ["PENDING"] }
        },
        include: { client: { select: { name: true } } },
        take: 30,
        orderBy: { uploadedAt: "desc" }
      });

      const answer = docs.length
        ? `Detected **${docs.length}** missing/pending document(s):\n\n` +
          docs
            .map((d, i) => `${i + 1}. **${d.client.name}** — ${d.docType} (${d.status})`)
            .join("\n") +
          `\n\n_Suggested next action:_ Send WhatsApp document reminders for these clients.`
        : "No missing/pending documents flagged in your authorized scope.";

      await persistTurn(conversation.id, userQuery, answer, "structured");
      await auditAiRequest(user, conversation.id, {
        sourceType: "structured",
        queryLength: userQuery.length,
        grounded: false
      });

      return {
        answer,
        sourceType: "structured",
        sources: [],
        lastUpdated: new Date().toISOString(),
        suggestedActions: ["Open Document Center", "Send WhatsApp reminders"],
        conversationId: conversation.id,
        data: docs
      };
    }

    if (
      qLower.includes("overdue") ||
      (qLower.includes("invoice") && (qLower.includes("unpaid") || qLower.includes("outstanding")))
    ) {
      const overdueInvoices = await prisma.invoice.findMany({
        where: {
          client: clientScope,
          status: { in: ["SENT", "OVERDUE"] }
        },
        include: { client: { select: { name: true } } },
        take: 25,
        orderBy: { dueDate: "asc" }
      });

      const answer = overdueInvoices.length
        ? `Found **${overdueInvoices.length}** outstanding invoice(s):\n\n` +
          overdueInvoices
            .map(
              (inv, i) =>
                `${i + 1}. **${inv.client.name}** — #${inv.invoiceNo} · ₹${inv.total} · Due ${inv.dueDate.toISOString().slice(0, 10)} · ${inv.status}`
            )
            .join("\n")
        : "All invoices in your scope are up to date.";

      await persistTurn(conversation.id, userQuery, answer, "structured");
      await auditAiRequest(user, conversation.id, {
        sourceType: "structured",
        queryLength: userQuery.length,
        grounded: false
      });

      return {
        answer,
        sourceType: "structured",
        sources: [],
        lastUpdated: new Date().toISOString(),
        suggestedActions: ["Open Billing", "Share UPI payment links"],
        conversationId: conversation.id,
        data: overdueInvoices
      };
    }

    if (
      qLower.includes("risk") ||
      qLower.includes("compliance summary") ||
      qLower.includes("practice summary") ||
      qLower.includes("pending actions") ||
      (qLower.includes("pending") && qLower.includes("what"))
    ) {
      const ctx = await buildPracticeContext(user, { clientId });
      const answer = [
        `**Compliance snapshot** for your authorized scope:`,
        `- Clients: ${ctx.stats.clientCount}`,
        `- GST due this month: ${ctx.stats.pendingGst}`,
        `- Pending ITR: ${ctx.stats.pendingItr}`,
        `- Outstanding invoices: ${ctx.stats.overdueInvoices}`,
        `- Open tasks: ${ctx.stats.openTasks}`,
        `- Missing/pending docs: ${ctx.stats.missingDocsApprox}`,
        "",
        "_This summary is generated from live practice records only._"
      ].join("\n");

      await persistTurn(conversation.id, userQuery, answer, "structured");
      await auditAiRequest(user, conversation.id, {
        sourceType: "structured",
        queryLength: userQuery.length,
        grounded: false
      });

      return {
        answer,
        sourceType: "structured",
        sources: [],
        lastUpdated: new Date().toISOString(),
        suggestedActions: defaultSuggestedActions(ctx.stats),
        conversationId: conversation.id,
        data: ctx.stats
      };
    }

    // Practice-data questions with empty workspace → short structured empty-state (no Gemini fluff)
    if (isPracticeDataQuery(userQuery)) {
      const practice = await buildPracticeContext(user, { clientId });
      if (practice.stats.clientCount === 0) {
        const answer =
          "Your TaxFlow workspace has **0 clients** in scope right now, so there are no ITR/GST filings, documents, or invoices for me to summarize.\n\nAdd clients from **Clients**, then create filings under **ITR** / **GST** — I'll answer from live practice data after that.";

        await persistTurn(conversation.id, userQuery, answer, "structured");
        await auditAiRequest(user, conversation.id, {
          sourceType: "structured",
          queryLength: userQuery.length,
          grounded: false
        });

        return {
          answer,
          sourceType: "structured",
          sources: [],
          lastUpdated: new Date().toISOString(),
          suggestedActions: ["Add a client", "Open Clients", "Open ITR Filings"],
          conversationId: conversation.id,
          data: practice.stats
        };
      }

      // Non-empty practice: prefer concise snapshot for generic practice asks that missed earlier intents
      if (
        qLower.includes("pending") ||
        qLower.includes("compliance") ||
        qLower.includes("status") ||
        qLower.includes("summary")
      ) {
        const answer = [
          `Live practice snapshot (authorized scope):`,
          `- Clients: ${practice.stats.clientCount}`,
          `- GST due this month: ${practice.stats.pendingGst}`,
          `- Pending ITR: ${practice.stats.pendingItr}`,
          `- Outstanding invoices: ${practice.stats.overdueInvoices}`,
          `- Open tasks: ${practice.stats.openTasks}`,
          `- Missing/pending docs: ${practice.stats.missingDocsApprox}`
        ].join("\n");

        await persistTurn(conversation.id, userQuery, answer, "structured");
        await auditAiRequest(user, conversation.id, {
          sourceType: "structured",
          queryLength: userQuery.length,
          grounded: false
        });

        return {
          answer,
          sourceType: "structured",
          sources: [],
          lastUpdated: new Date().toISOString(),
          suggestedActions: defaultSuggestedActions(practice.stats),
          conversationId: conversation.id,
          data: practice.stats
        };
      }
    }

    // --- Gemini path (knowledge + optional practice context + grounding) ---
    try {
      const resolvedClientId =
        clientId || (await resolveClientIdFromQuery(user, userQuery));
      const practice = await buildPracticeContext(user, { clientId: resolvedClientId });
      const useGrounding = shouldUseGrounding(userQuery) || !isPracticeDataQuery(userQuery);
      const practiceIsEmpty = practice.stats.clientCount === 0;

      const messages = [
        { role: "system" as const, content: CA_SYSTEM_PROMPT },
        ...(practiceIsEmpty
          ? [
              {
                role: "system" as const,
                content: `${KNOWLEDGE_CONTEXT_NOTE}\n\nPractice workspace note: 0 clients currently in scope. Do not invent practice filings.`
              }
            ]
          : [
              {
                role: "system" as const,
                content: `${PRACTICE_CONTEXT_PREAMBLE}\n\n${practice.summaryText}`
              }
            ]),
        ...(useGrounding && !practiceIsEmpty
          ? [{ role: "system" as const, content: KNOWLEDGE_CONTEXT_NOTE }]
          : []),
        { role: "user" as const, content: userQuery }
      ];

      const completion = await aiProvider.generateChatCompletion(messages, {
        useGrounding,
        temperature: 0.2
      });

      const sourceType: AiSourceType = completion.grounded ? "grounded" : "gemini";
      let answer = completion.text;

      if (completion.grounded && completion.sources.length) {
        const lastUpdated = new Date().toISOString();
        const sourceLines = completion.sources
          .slice(0, 5)
          .map((s, i) => `${i + 1}. [${s.title}](${s.url})`)
          .join("\n");
        answer += `\n\n---\n**Sources** (Last updated: ${lastUpdated}):\n${sourceLines}\n\n_Verify against official portals before filing._`;
      }

      await persistTurn(conversation.id, userQuery, answer, sourceType);
      await auditAiRequest(user, conversation.id, {
        sourceType,
        queryLength: userQuery.length,
        grounded: completion.grounded
      });

      return {
        answer,
        sourceType,
        sources: completion.sources,
        lastUpdated: completion.grounded ? new Date().toISOString() : null,
        suggestedActions: defaultSuggestedActions(practice.stats),
        conversationId: conversation.id,
        model: completion.model
      };
    } catch (err) {
      if (err instanceof AppError && err.code === "AI_NOT_CONFIGURED") {
        throw err;
      }

      const isRateLimited =
        err instanceof AppError && (err.code === "AI_RATE_LIMITED" || err.statusCode === 429);

      logger.warn(
        { message: (err as any)?.message || "Gemini path failed" },
        "Falling back to structured practice summary"
      );

      const practice = await buildPracticeContext(user, { clientId });
      const answer = isRateLimited
        ? [
            "Gemini API quota/rate limit was reached for this API key.",
            "Please wait a minute or check billing/quota at https://ai.dev/rate-limit, then retry.",
            "",
            "Meanwhile, here is a live practice summary from your authorized records:",
            "",
            `- Clients: ${practice.stats.clientCount}`,
            `- GST due this month: ${practice.stats.pendingGst}`,
            `- Pending ITR: ${practice.stats.pendingItr}`,
            `- Outstanding invoices: ${practice.stats.overdueInvoices}`,
            `- Open tasks: ${practice.stats.openTasks}`,
            `- Missing/pending docs: ${practice.stats.missingDocsApprox}`
          ].join("\n")
        : [
            "TaxFlow AI could not reach Gemini just now. Here is a live practice summary from your authorized records:",
            "",
            `- Clients: ${practice.stats.clientCount}`,
            `- GST due this month: ${practice.stats.pendingGst}`,
            `- Pending ITR: ${practice.stats.pendingItr}`,
            `- Outstanding invoices: ${practice.stats.overdueInvoices}`,
            `- Open tasks: ${practice.stats.openTasks}`,
            `- Missing/pending docs: ${practice.stats.missingDocsApprox}`,
            "",
            "Please retry in a moment for full AI explanations."
          ].join("\n");

      await persistTurn(conversation.id, userQuery, answer, "fallback");
      await auditAiRequest(user, conversation.id, {
        sourceType: "fallback",
        queryLength: userQuery.length,
        grounded: false
      });

      return {
        answer,
        sourceType: "fallback",
        sources: [],
        lastUpdated: new Date().toISOString(),
        suggestedActions: defaultSuggestedActions(practice.stats),
        conversationId: conversation.id,
        data: practice.stats
      };
    }
  }

  public static async getConversations(userId: string) {
    return prisma.aiConversation.findMany({
      where: { userId },
      include: { messages: { orderBy: { createdAt: "asc" }, take: 50 } },
      orderBy: { createdAt: "desc" },
      take: 20
    });
  }
}
