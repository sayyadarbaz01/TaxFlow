import { AuthUser } from "@ca-saas/shared-types";
import { prisma } from "../../lib/db";
import { scopeToAssignedClients } from "../../lib/permissions";

export interface PracticeContextBundle {
  summaryText: string;
  /** Structured payload for structured intents (never send full raw DB dump to Gemini). */
  stats: {
    clientCount: number;
    pendingGst: number;
    pendingItr: number;
    overdueInvoices: number;
    openTasks: number;
    missingDocsApprox: number;
  };
}

function maskPan(pan?: string | null): string | null {
  if (!pan || pan.length < 4) return pan || null;
  return `${pan.slice(0, 2)}****${pan.slice(-2)}`;
}

function maskGstin(gstin?: string | null): string | null {
  if (!gstin || gstin.length < 6) return gstin || null;
  return `${gstin.slice(0, 4)}****${gstin.slice(-4)}`;
}

/**
 * Builds a compact, RBAC-scoped practice snapshot for Gemini.
 * Omits unnecessary sensitive fields; masks PAN/GSTIN mid-characters.
 */
export async function buildPracticeContext(
  user: AuthUser,
  options?: { clientId?: string; clientNameHint?: string }
): Promise<PracticeContextBundle> {
  const clientScope = scopeToAssignedClients(user, {});
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const whereClients = options?.clientId
    ? scopeToAssignedClients(user, { id: options.clientId })
    : options?.clientNameHint
      ? scopeToAssignedClients(user, {
          name: { contains: options.clientNameHint, mode: "insensitive" as const }
        })
      : clientScope;

  const [clients, pendingGst, pendingItr, overdueInvoices, openTasks, documents] =
    await Promise.all([
      prisma.client.findMany({
        where: whereClients,
        select: {
          id: true,
          name: true,
          pan: true,
          gstin: true,
          entityType: true,
          status: true,
          workType: true
        },
        take: 40,
        orderBy: { updatedAt: "desc" }
      }),
      prisma.gstReturn.findMany({
        where: {
          client: clientScope,
          status: { in: ["NOT_STARTED", "PENDING", "OVERDUE"] },
          dueDate: { gte: monthStart, lte: monthEnd }
        },
        include: { client: { select: { name: true } } },
        take: 25,
        orderBy: { dueDate: "asc" }
      }),
      prisma.itrFiling.findMany({
        where: {
          client: clientScope,
          status: {
            in: ["NOT_STARTED", "DOCUMENTS_PENDING", "UNDER_PREPARATION"]
          }
        },
        include: { client: { select: { name: true } } },
        take: 25,
        orderBy: { dueDate: "asc" }
      }),
      prisma.invoice.findMany({
        where: {
          client: clientScope,
          status: { in: ["SENT", "OVERDUE"] }
        },
        include: { client: { select: { name: true } } },
        take: 20,
        orderBy: { dueDate: "asc" }
      }),
      prisma.task.findMany({
        where: {
          client: clientScope,
          status: { in: ["TODO", "IN_PROGRESS"] }
        },
        include: { client: { select: { name: true } } },
        take: 25,
        orderBy: { dueDate: "asc" }
      }),
      prisma.clientDocument.findMany({
        where: { client: clientScope, status: "PENDING" },
        select: {
          clientId: true,
          docType: true,
          status: true,
          fileName: true,
          client: { select: { name: true } }
        },
        take: 80,
        orderBy: { uploadedAt: "desc" }
      })
    ]);

  const missingDocs = documents;

  const clientLines = clients.map((c) => {
    return `- ${c.name} | status=${c.status} | entity=${c.entityType} | work=${c.workType || "N/A"} | PAN=${maskPan(c.pan) || "N/A"} | GSTIN=${maskGstin(c.gstin) || "N/A"}`;
  });

  const gstLines = pendingGst.map(
    (g) =>
      `- ${g.client.name}: ${g.returnType} ${g.period} due ${g.dueDate.toISOString().slice(0, 10)} status=${g.status}`
  );

  const itrLines = pendingItr.map(
    (f) =>
      `- ${f.client.name}: AY ${f.assessmentYear} ${f.itrFormType} due ${f.dueDate.toISOString().slice(0, 10)} status=${f.status}`
  );

  const invoiceLines = overdueInvoices.map(
    (inv) =>
      `- ${inv.client.name}: #${inv.invoiceNo} ₹${inv.total} due ${inv.dueDate.toISOString().slice(0, 10)} status=${inv.status}`
  );

  const taskLines = openTasks.map(
    (t) =>
      `- ${t.title} | client=${t.client?.name || "N/A"} | due=${t.dueDate.toISOString().slice(0, 10)} | priority=${t.priority} | status=${t.status}`
  );

  const missingDocLines = missingDocs.slice(0, 20).map(
    (d) => `- ${d.client.name}: ${d.docType} (${d.status}) ${d.fileName || ""}`.trim()
  );

  const summaryText = [
    `As of: ${now.toISOString()}`,
    `User: ${user.name} (${user.role})`,
    "",
    `Clients in scope (${clients.length}):`,
    clientLines.length ? clientLines.join("\n") : "- None",
    "",
    `GST returns due this month (${pendingGst.length}):`,
    gstLines.length ? gstLines.join("\n") : "- None",
    "",
    `Pending ITR filings (${pendingItr.length}):`,
    itrLines.length ? itrLines.join("\n") : "- None",
    "",
    `Outstanding invoices (${overdueInvoices.length}):`,
    invoiceLines.length ? invoiceLines.join("\n") : "- None",
    "",
    `Open tasks (${openTasks.length}):`,
    taskLines.length ? taskLines.join("\n") : "- None",
    "",
    `Missing/pending documents (sample ${missingDocLines.length}):`,
    missingDocLines.length ? missingDocLines.join("\n") : "- None flagged"
  ].join("\n");

  return {
    summaryText,
    stats: {
      clientCount: clients.length,
      pendingGst: pendingGst.length,
      pendingItr: pendingItr.length,
      overdueInvoices: overdueInvoices.length,
      openTasks: openTasks.length,
      missingDocsApprox: missingDocs.length
    }
  };
}

export async function resolveClientIdFromQuery(
  user: AuthUser,
  query: string
): Promise<string | undefined> {
  const clientScope = scopeToAssignedClients(user, {});
  const clients = await prisma.client.findMany({
    where: clientScope,
    select: { id: true, name: true },
    take: 100
  });

  const q = query.toLowerCase();
  const hit = clients.find((c) => c.name && q.includes(c.name.toLowerCase()));
  return hit?.id;
}
