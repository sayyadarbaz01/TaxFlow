import { prisma } from "../../lib/db";
import { scopeToAssignedClients } from "../../lib/permissions";
import { AuthUser, DashboardSummaryResponse, DailyActivityRecord } from "@ca-saas/shared-types";

export class DashboardService {
  public static async getSummary(user: AuthUser): Promise<DashboardSummaryResponse> {
    const clientScope = scopeToAssignedClients(user, {});
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const in7Days = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000 - 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // 1. Total Revenue (Aggregate of paid invoices & successful payments)
    const [paidInvoicesAgg, paidThisMonthAgg, paidLastMonthAgg] = await Promise.all([
      prisma.invoice.aggregate({
        where: {
          client: clientScope,
          status: "PAID"
        },
        _sum: { total: true }
      }),
      prisma.invoice.aggregate({
        where: {
          client: clientScope,
          status: "PAID",
          paidAt: { gte: startOfMonth }
        },
        _sum: { total: true }
      }),
      prisma.invoice.aggregate({
        where: {
          client: clientScope,
          status: "PAID",
          paidAt: { gte: startOfLastMonth, lt: startOfMonth }
        },
        _sum: { total: true }
      })
    ]);

    const totalRevenue = paidInvoicesAgg._sum.total || 0;
    const totalRevenueThisMonth = paidThisMonthAgg._sum.total || 0;
    const totalRevenueLastMonth = paidLastMonthAgg._sum.total || 0;

    let totalRevenueComparison: string | null = null;
    if (totalRevenueLastMonth > 0) {
      const diff = Math.round(((totalRevenueThisMonth - totalRevenueLastMonth) / totalRevenueLastMonth) * 100);
      totalRevenueComparison = `${diff >= 0 ? "+" : ""}${diff}% vs last month`;
    } else if (totalRevenueThisMonth > 0) {
      totalRevenueComparison = `₹${totalRevenueThisMonth.toLocaleString("en-IN")} this month`;
    }

    // 2. Active Clients
    const clientWhere: any = { ...clientScope, status: "ACTIVE" };
    const totalClientsActive = await prisma.client.count({
      where: clientWhere
    });

    let activeClientsComparison: string | null = null;
    const prevClients = await prisma.client.count({
      where: { ...clientWhere, createdAt: { lt: startOfMonth } }
    });
    if (prevClients > 0 && prevClients !== totalClientsActive) {
      const diff = Math.round(((totalClientsActive - prevClients) / prevClients) * 100);
      activeClientsComparison = `${diff >= 0 ? "+" : ""}${diff}% vs last month`;
    }

    // 3. Pending Filings (ITR pending + GST returns pending)
    const pendingItrStatuses = ["NOT_STARTED", "DOCUMENTS_PENDING", "UNDER_PREPARATION", "FILED"];
    const itrPendingWhere: any = {
      client: clientScope,
      status: { in: pendingItrStatuses }
    };

    const [itrPending, itrOverdue] = await Promise.all([
      prisma.itrFiling.count({ where: itrPendingWhere }),
      prisma.itrFiling.count({
        where: { ...itrPendingWhere, dueDate: { lt: todayStart } }
      })
    ]);

    const gstPendingWhere: any = {
      client: clientScope,
      status: { not: "FILED" }
    };

    const [gstReturnsPending, gstReturnsOverdue, gstReturnsDue] = await Promise.all([
      prisma.gstReturn.count({ where: gstPendingWhere }),
      prisma.gstReturn.count({
        where: {
          client: clientScope,
          status: { not: "FILED" },
          dueDate: { lt: todayStart }
        }
      }),
      prisma.gstReturn.count({
        where: {
          client: clientScope,
          status: { not: "FILED" },
          dueDate: { lte: in7Days }
        }
      })
    ]);

    const pendingFilings = itrPending + gstReturnsPending;
    const pendingFilingsOverdue = itrOverdue + gstReturnsOverdue;

    let pendingFilingsComparison: string | null = null;
    if (pendingFilingsOverdue > 0) {
      pendingFilingsComparison = `${pendingFilingsOverdue} overdue`;
    }

    // 4. Total Leads
    const leadWhere: any = { ...clientScope, status: "LEAD" };
    const [totalLeads, newLeadsThisMonth, prevLeads] = await Promise.all([
      prisma.client.count({ where: leadWhere }),
      prisma.client.count({
        where: { ...leadWhere, createdAt: { gte: startOfMonth } }
      }),
      prisma.client.count({
        where: { ...leadWhere, createdAt: { lt: startOfMonth } }
      })
    ]);

    let totalLeadsComparison: string | null = null;
    if (prevLeads > 0 && prevLeads !== totalLeads) {
      const diff = Math.round(((totalLeads - prevLeads) / prevLeads) * 100);
      totalLeadsComparison = `${diff >= 0 ? "+" : ""}${diff}% vs last month`;
    } else if (newLeadsThisMonth > 0) {
      totalLeadsComparison = `${newLeadsThisMonth} new this month`;
    }

    // 5. Outstanding Fees & Overdue Outstanding Fees (For backward compatibility / widgets)
    const invoices = await prisma.invoice.findMany({
      where: {
        client: clientScope,
        status: { in: ["SENT", "OVERDUE", "DRAFT"] }
      },
      select: {
        id: true,
        total: true,
        dueDate: true,
        status: true,
        payments: {
          where: {
            status: { in: ["SUCCESS", "PAID", "COMPLETED"] }
          },
          select: {
            amount: true
          }
        }
      }
    });

    let outstandingFees = 0;
    let outstandingFeesOverdue = 0;

    for (const inv of invoices) {
      const paidAmount = inv.payments.reduce((sum, p) => sum + p.amount, 0);
      const balance = Math.max(0, inv.total - paidAmount);
      if (balance > 0) {
        outstandingFees += balance;
        if (inv.dueDate < todayStart || inv.status === "OVERDUE") {
          outstandingFeesOverdue += balance;
        }
      }
    }

    // 6. Weekly Activity (Past 7 days up to today)
    const weeklyActivity: DailyActivityRecord[] = [];
    const sevenDaysAgo = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);

    const [recentItrs, recentGsts, recentTasks] = await Promise.all([
      prisma.itrFiling.findMany({
        where: {
          client: clientScope,
          updatedAt: { gte: sevenDaysAgo }
        },
        select: { updatedAt: true, status: true }
      }),
      prisma.gstReturn.findMany({
        where: {
          client: clientScope,
          updatedAt: { gte: sevenDaysAgo }
        },
        select: { updatedAt: true, status: true }
      }),
      prisma.task.findMany({
        where: {
          client: clientScope,
          updatedAt: { gte: sevenDaysAgo }
        },
        select: { updatedAt: true, status: true }
      })
    ]);

    for (let i = 6; i >= 0; i--) {
      const dayDate = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(dayDate.getTime() + 24 * 60 * 60 * 1000);
      const dayLabel = dayDate.toLocaleDateString("en-US", { weekday: "short" });
      const dateStr = dayDate.toISOString().split("T")[0];

      const filingsCount =
        recentItrs.filter(
          (itr) =>
            itr.updatedAt >= dayDate &&
            itr.updatedAt < nextDate &&
            (itr.status === "FILED" || itr.status === "PROCESSED" || itr.status === "VERIFIED")
        ).length +
        recentGsts.filter(
          (gst) =>
            gst.updatedAt >= dayDate &&
            gst.updatedAt < nextDate &&
            gst.status === "FILED"
        ).length;

      const tasksCount = recentTasks.filter(
        (t) =>
          t.updatedAt >= dayDate &&
          t.updatedAt < nextDate &&
          t.status === "DONE"
      ).length;

      weeklyActivity.push({
        day: dayLabel,
        date: dateStr,
        filings: filingsCount,
        tasks: tasksCount
      });
    }

    return {
      // 4 Main KPI Cards
      totalRevenue,
      totalRevenueThisMonth,
      totalRevenueComparison,

      activeClients: totalClientsActive,
      activeClientsComparison,

      pendingFilings,
      pendingFilingsOverdue,
      pendingFilingsComparison,

      totalLeads,
      newLeadsThisMonth,
      totalLeadsComparison,

      // Weekly Activity
      weeklyActivity,

      // Backward compatibility fields
      totalClients: totalClientsActive,
      totalClientsActive,
      totalClientsComparison: activeClientsComparison,
      itrPending,
      itrOverdue,
      itrComparison: null,
      gstReturnsDue,
      gstReturnsOverdue,
      gstComparison: null,
      outstandingFees,
      outstandingFeesOverdue,
      outstandingFeesComparison: null
    };
  }
}
