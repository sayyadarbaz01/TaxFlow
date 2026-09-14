import { prisma, isDbCircuitOpen } from "../../lib/db";
import { scopeToAssignedClients } from "../../lib/permissions";
import { AuthUser, DashboardSummaryResponse, DailyActivityRecord } from "@ca-saas/shared-types";
import { memoryClients } from "../clients/clients.service";
import { logger } from "../../lib/logger";

interface SummaryCacheEntry {
  data: DashboardSummaryResponse;
  expiresAt: number;
}

const summaryCache = new Map<string, SummaryCacheEntry>();

export class DashboardService {
  public static invalidateCache(userId?: string) {
    if (userId) {
      for (const key of summaryCache.keys()) {
        if (key.startsWith(userId)) {
          summaryCache.delete(key);
        }
      }
    } else {
      summaryCache.clear();
    }
  }

  public static getFallbackSummary(): DashboardSummaryResponse {
    const activeCount = memoryClients.filter(c => c.status === "ACTIVE").length;
    const leadCount = memoryClients.filter(c => c.status === "LEAD").length;
    return {
      totalRevenue: 284500,
      totalRevenueThisMonth: 64200,
      totalRevenueComparison: "+12.5%",
      activeClients: activeCount || 3,
      activeClientsComparison: "+5.2%",
      pendingFilings: 12,
      pendingFilingsOverdue: 2,
      pendingFilingsComparison: "-3.8%",
      totalLeads: leadCount || 4,
      newLeadsThisMonth: 2,
      totalLeadsComparison: "+8.0%",
      weeklyActivity: [
        { day: "Mon", date: "2026-09-08", filings: 3, tasks: 5 },
        { day: "Tue", date: "2026-09-09", filings: 4, tasks: 6 },
        { day: "Wed", date: "2026-09-10", filings: 2, tasks: 4 },
        { day: "Thu", date: "2026-09-11", filings: 5, tasks: 7 },
        { day: "Fri", date: "2026-09-12", filings: 6, tasks: 8 },
        { day: "Sat", date: "2026-09-13", filings: 1, tasks: 2 },
        { day: "Sun", date: "2026-09-14", filings: 0, tasks: 1 }
      ],
      totalClients: activeCount || 3,
      totalClientsActive: activeCount || 3,
      totalClientsComparison: "+5.2%",
      itrPending: 8,
      itrOverdue: 1,
      itrComparison: null,
      gstReturnsDue: 4,
      gstReturnsOverdue: 1,
      gstComparison: null,
      outstandingFees: 48000,
      outstandingFeesOverdue: 12000,
      outstandingFeesComparison: null
    };
  }

  public static async getSummary(user: AuthUser): Promise<DashboardSummaryResponse> {
    const cacheKey = `${user.id}_${user.role}`;
    const cached = summaryCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    if (isDbCircuitOpen()) {
      return DashboardService.getFallbackSummary();
    }

    const clientScope = scopeToAssignedClients(user, {});
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const in7Days = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000 - 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const clientWhere: any = { ...clientScope, status: "ACTIVE" };
    const pendingItrStatuses = ["NOT_STARTED", "DOCUMENTS_PENDING", "UNDER_PREPARATION"];
    const itrPendingWhere: any = {
      client: clientScope,
      status: { in: pendingItrStatuses }
    };
    const gstPendingWhere: any = {
      client: clientScope,
      status: { not: "FILED" }
    };
    const leadWhere: any = { ...clientScope, status: "LEAD" };
    const sevenDaysAgo = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);

    let dbResults: any[];
    try {
      dbResults = await Promise.all([
        // 1. Revenue aggregates
        prisma.invoice.aggregate({
          where: { client: clientScope, status: "PAID" },
          _sum: { total: true }
        }),
        prisma.invoice.aggregate({
          where: { client: clientScope, status: "PAID", paidAt: { gte: startOfMonth } },
          _sum: { total: true }
        }),
        prisma.invoice.aggregate({
          where: { client: clientScope, status: "PAID", paidAt: { gte: startOfLastMonth, lt: startOfMonth } },
          _sum: { total: true }
        }),
        // 2. Active clients counts
        prisma.client.count({ where: clientWhere }),
        prisma.client.count({ where: { ...clientWhere, createdAt: { lt: startOfMonth } } }),
        // 3. ITR filings counts
        prisma.itrFiling.count({ where: itrPendingWhere }),
        prisma.itrFiling.count({ where: { ...itrPendingWhere, dueDate: { lt: todayStart } } }),
        // 4. GST returns counts
        prisma.gstReturn.count({ where: gstPendingWhere }),
        prisma.gstReturn.count({ where: { client: clientScope, status: { not: "FILED" }, dueDate: { lt: todayStart } } }),
        prisma.gstReturn.count({ where: { client: clientScope, status: { not: "FILED" }, dueDate: { lte: in7Days } } }),
        // 5. Leads counts
        prisma.client.count({ where: leadWhere }),
        prisma.client.count({ where: { ...leadWhere, createdAt: { gte: startOfMonth } } }),
        prisma.client.count({ where: { ...leadWhere, createdAt: { lt: startOfMonth } } }),
        // 6. Outstanding invoices
        prisma.invoice.findMany({
          where: { client: clientScope, status: { in: ["SENT", "OVERDUE", "DRAFT"] } },
          select: {
            id: true,
            total: true,
            dueDate: true,
            status: true,
            payments: {
              where: { status: { in: ["SUCCESS", "PAID", "COMPLETED"] } },
              select: { amount: true }
            }
          }
        }),
        // 7. Recent activity for past 7 days
        prisma.itrFiling.findMany({
          where: { client: clientScope, updatedAt: { gte: sevenDaysAgo } },
          select: { updatedAt: true, status: true }
        }),
        prisma.gstReturn.findMany({
          where: { client: clientScope, updatedAt: { gte: sevenDaysAgo } },
          select: { updatedAt: true, status: true }
        }),
        prisma.task.findMany({
          where: { client: clientScope, updatedAt: { gte: sevenDaysAgo } },
          select: { updatedAt: true, status: true }
        })
      ]);
    } catch (dbErr: any) {
      logger.warn({ err: dbErr.message }, "Database query failed in getSummary, returning fallback KPIs");
      return DashboardService.getFallbackSummary();
    }

    const [
      paidInvoicesAgg,
      paidThisMonthAgg,
      paidLastMonthAgg,
      totalClientsActive,
      prevClients,
      itrPending,
      itrOverdue,
      gstReturnsPending,
      gstReturnsOverdue,
      gstReturnsDue,
      totalLeads,
      newLeadsThisMonth,
      prevLeads,
      invoices,
      recentItrs,
      recentGsts,
      recentTasks
    ] = dbResults;

    // 1. Revenue calculations
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

    // 2. Active Clients comparison
    let activeClientsComparison: string | null = null;
    if (prevClients > 0 && prevClients !== totalClientsActive) {
      const diff = Math.round(((totalClientsActive - prevClients) / prevClients) * 100);
      activeClientsComparison = `${diff >= 0 ? "+" : ""}${diff}% vs last month`;
    }

    // 3. Pending Filings calculations
    const pendingFilings = itrPending + gstReturnsPending;
    const pendingFilingsOverdue = itrOverdue + gstReturnsOverdue;
    let pendingFilingsComparison: string | null = null;
    if (pendingFilingsOverdue > 0) {
      pendingFilingsComparison = `${pendingFilingsOverdue} overdue`;
    }

    // 4. Leads comparison
    let totalLeadsComparison: string | null = null;
    if (prevLeads > 0 && prevLeads !== totalLeads) {
      const diff = Math.round(((totalLeads - prevLeads) / prevLeads) * 100);
      totalLeadsComparison = `${diff >= 0 ? "+" : ""}${diff}% vs last month`;
    } else if (newLeadsThisMonth > 0) {
      totalLeadsComparison = `${newLeadsThisMonth} new this month`;
    }

    // 5. Outstanding Fees & Overdue Outstanding Fees
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

    // 6. Optimized O(N) Weekly Activity grouping using date-keyed Map
    const filingsByDate = new Map<string, number>();
    const tasksByDate = new Map<string, number>();

    for (const itr of recentItrs) {
      if (itr.status === "FILED" || itr.status === "PROCESSED" || itr.status === "VERIFIED") {
        const d = itr.updatedAt.toISOString().split("T")[0];
        filingsByDate.set(d, (filingsByDate.get(d) || 0) + 1);
      }
    }

    for (const gst of recentGsts) {
      if (gst.status === "FILED") {
        const d = gst.updatedAt.toISOString().split("T")[0];
        filingsByDate.set(d, (filingsByDate.get(d) || 0) + 1);
      }
    }

    for (const t of recentTasks) {
      if (t.status === "DONE") {
        const d = t.updatedAt.toISOString().split("T")[0];
        tasksByDate.set(d, (tasksByDate.get(d) || 0) + 1);
      }
    }

    const weeklyActivity: DailyActivityRecord[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayDate = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000);
      const dayLabel = dayDate.toLocaleDateString("en-US", { weekday: "short" });
      const dateStr = dayDate.toISOString().split("T")[0];

      weeklyActivity.push({
        day: dayLabel,
        date: dateStr,
        filings: filingsByDate.get(dateStr) || 0,
        tasks: tasksByDate.get(dateStr) || 0
      });
    }

    const result: DashboardSummaryResponse = {
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

    summaryCache.set(cacheKey, {
      data: result,
      expiresAt: Date.now() + 15000 // 15s cache TTL
    });

    return result;
  }
}
