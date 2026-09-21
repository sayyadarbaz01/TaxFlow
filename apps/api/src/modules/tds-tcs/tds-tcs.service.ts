import { prisma } from "../../lib/db";
import { scopeToAssignedClients } from "../../lib/permissions";
import { buildPaginationParams, formatPaginatedResponse } from "../../lib/utils";
import { NotFoundError } from "../../middleware/errorHandler";
import { AuthUser, TdsEntryType } from "@ca-saas/shared-types";

/** Pure reconciliation rules used by createEntry — unit-tested independently. */
export function computeTdsReconciliation(expectedAmount: number, creditedAmount: number) {
  const mismatchAmount = Math.abs(expectedAmount - creditedAmount);
  let reconciliationStatus: "MATCHED" | "MISMATCH_UNDER" | "MISMATCH_OVER" = "MATCHED";

  if (creditedAmount < expectedAmount) {
    reconciliationStatus = "MISMATCH_UNDER";
  } else if (creditedAmount > expectedAmount) {
    reconciliationStatus = "MISMATCH_OVER";
  }

  return { mismatchAmount, reconciliationStatus };
}

export class TdsTcsService {
  public static async listEntries(user: AuthUser, query: Record<string, any>) {
    const { page, pageSize, skip } = buildPaginationParams(query);
    const clientId = query.clientId as string;
    const financialYear = query.financialYear as string;

    const clientScope = scopeToAssignedClients(user, {});
    const whereCondition: any = { client: clientScope };

    if (clientId) whereCondition.clientId = clientId;
    if (financialYear) whereCondition.financialYear = financialYear;

    const [entries, total] = await Promise.all([
      prisma.tdsTcsEntry.findMany({
        where: whereCondition,
        include: { client: { select: { id: true, name: true, pan: true } } },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" }
      }),
      prisma.tdsTcsEntry.count({ where: whereCondition })
    ]);

    const formatted = entries.map(e => ({
      id: e.id,
      clientId: e.clientId,
      clientName: e.client.name,
      financialYear: e.financialYear,
      deductorTan: e.deductorTan,
      amount: e.amount,
      entryType: e.entryType as any,
      sourceDocId: e.sourceDocId,
      reconciliationStatus: e.reconciliationStatus as any,
      refundStatus: e.refundStatus,
      expectedAmount: e.expectedAmount,
      creditedAmount: e.creditedAmount,
      mismatchAmount: e.mismatchAmount,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString()
    }));

    return formatPaginatedResponse(formatted, total, page, pageSize);
  }

  public static async createEntry(
    clientId: string,
    financialYear: string,
    deductorTan: string,
    expectedAmount: number,
    creditedAmount: number,
    entryType: TdsEntryType,
    user: AuthUser
  ) {
    const clientScope = scopeToAssignedClients(user, { id: clientId });
    const client = await prisma.client.findFirst({ where: clientScope });
    if (!client) throw new NotFoundError("Client not found");

    const { mismatchAmount, reconciliationStatus } = computeTdsReconciliation(
      expectedAmount,
      creditedAmount
    );

    const entry = await prisma.tdsTcsEntry.create({
      data: {
        clientId,
        financialYear,
        deductorTan,
        amount: creditedAmount,
        expectedAmount,
        creditedAmount,
        mismatchAmount,
        entryType: entryType || "TDS",
        reconciliationStatus
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "TDS_ENTRY_CREATED",
        entityType: "TdsTcsEntry",
        entityId: entry.id,
        after: { deductorTan, expectedAmount, creditedAmount, reconciliationStatus }
      }
    });

    return entry;
  }
}
