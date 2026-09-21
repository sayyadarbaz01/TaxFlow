import { prisma } from "../../lib/db";
import { scopeToAssignedClients } from "../../lib/permissions";
import { buildPaginationParams, formatPaginatedResponse } from "../../lib/utils";
import { NotFoundError } from "../../middleware/errorHandler";
import { AuthUser, InvoiceLineItem } from "@ca-saas/shared-types";

/** Pure invoice math — unit-tested independently of Prisma. */
export function calculateInvoiceTotals(
  lineItems: Array<{ amount: number }>,
  taxRatePercentage = 18
) {
  const subtotal = lineItems.reduce((acc, item) => acc + item.amount, 0);
  const tax = Math.round((subtotal * taxRatePercentage) / 100);
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

export function buildUpiPaymentLink(total: number, invoiceNo: string) {
  return `upi://pay?pa=capractice@upi&pn=CA%20Practice&am=${total}&tn=${invoiceNo}&cu=INR`;
}

export class BillingService {
  public static async listInvoices(user: AuthUser, query: Record<string, any>) {
    const { page, pageSize, skip } = buildPaginationParams(query);
    const status = query.status as string;

    const clientScope = scopeToAssignedClients(user, {});
    const whereCondition: any = { client: clientScope };
    if (status === "unpaid") {
      whereCondition.status = { in: ["SENT", "OVERDUE", "DRAFT"] };
    } else if (status) {
      whereCondition.status = status;
    }

    const orderBy: any = status === "unpaid" ? [{ dueDate: "asc" }, { total: "desc" }] : { createdAt: "desc" };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: whereCondition,
        include: { client: { select: { id: true, name: true } } },
        skip,
        take: pageSize,
        orderBy
      }),
      prisma.invoice.count({ where: whereCondition })
    ]);

    const formatted = invoices.map((inv: any) => ({
      id: inv.id,
      invoiceNo: inv.invoiceNo,
      clientId: inv.clientId,
      clientName: inv.client?.name || "Unknown Client",
      subtotal: inv.subtotal,
      tax: inv.tax,
      total: inv.total,
      lineItems: inv.lineItems as any,
      dueDate: inv.dueDate.toISOString().split("T")[0],
      status: inv.status as any,
      upiLink: inv.upiLink,
      paidAt: inv.paidAt ? inv.paidAt.toISOString() : null,
      createdAt: inv.createdAt.toISOString(),
      updatedAt: inv.updatedAt.toISOString()
    }));

    return formatPaginatedResponse(formatted, total, page, pageSize);
  }

  public static async getInvoiceById(id: string, _user: AuthUser) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { client: true }
    });
    if (!invoice) {
      throw new NotFoundError("Invoice not found");
    }
    return invoice;
  }

  public static async createInvoice(
    clientId: string,
    lineItems: InvoiceLineItem[],
    dueDateStr: string,
    taxRatePercentage = 18,
    user: AuthUser
  ) {
    const { subtotal, tax, total } = calculateInvoiceTotals(lineItems, taxRatePercentage);

    const count = await prisma.invoice.count();
    const invoiceNo = `INV-2026-${String(count + 1).padStart(3, "0")}`;
    const upiLink = buildUpiPaymentLink(total, invoiceNo);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        clientId,
        subtotal,
        tax,
        total,
        lineItems: lineItems as any,
        dueDate: new Date(dueDateStr),
        status: "SENT",
        upiLink
      },
      include: { client: true }
    });

    return invoice;
  }

  public static async markPaid(id: string, _method = "UPI", _user: AuthUser) {
    const updated = await prisma.invoice.update({
      where: { id },
      data: { status: "PAID", paidAt: new Date() }
    });
    return { invoice: updated };
  }

  public static async getUpiLink(id: string) {
    const inv = await prisma.invoice.findUnique({ where: { id } });
    if (!inv) {
      throw new NotFoundError("Invoice not found");
    }
    return { invoiceId: inv.id, invoiceNo: inv.invoiceNo, amount: inv.total, upiLink: inv.upiLink, qrData: inv.upiLink };
  }
}
