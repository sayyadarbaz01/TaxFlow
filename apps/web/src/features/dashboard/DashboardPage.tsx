import React, { useState, useMemo, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  Users,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Plus,
  Bot,
  Calendar,
  IndianRupee,
  UserPlus,
  ListTodo,
  BarChart3,
  FileCheck,
  CheckCircle,
  Circle,
  Search,
  ArrowUpRight,
  Filter,
  Activity,
  Layers,
  CheckSquare2
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { PageHeader } from "../../components/ui/PageHeader";
import { MetricCard } from "../../components/ui/MetricCard";
import {
  useGetDashboardSummaryQuery,
  useGetClientsQuery,
  useGetItrFilingsQuery,
  useGetGstReturnsQuery,
  useGetInvoicesQuery,
  useGetTasksQuery,
  useUpdateTaskStatusMutation
} from "../../lib/api";
import { AuthUser, DailyActivityRecord } from "@ca-saas/shared-types";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = (useOutletContext<{ user?: AuthUser }>() || {}) as { user?: AuthUser };

  // Data Queries
  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    refetch: refetchSummary
  } = useGetDashboardSummaryQuery();

  const { data: clientsData } = useGetClientsQuery({});
  const { data: itrData } = useGetItrFilingsQuery({});
  const { data: gstData } = useGetGstReturnsQuery({});
  const { data: invoiceData } = useGetInvoicesQuery({});
  const { data: tasksData, refetch: refetchTasks } = useGetTasksQuery({});

  // Mutations
  const [updateTaskStatus, { isLoading: isUpdatingTask }] = useUpdateTaskStatusMutation();

  // Component States
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  const [pendingFilterTab, setPendingFilterTab] = useState<"ALL" | "GST" | "ITR">("ALL");
  const [pendingSearch, setPendingSearch] = useState("");
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);

  // Derived Client & Filing Lists with useMemo to eliminate redundant renders
  const totalClients = useMemo(
    () => clientsData?.total || clientsData?.data?.length || 0,
    [clientsData?.total, clientsData?.data]
  );

  const pendingItrList = useMemo(() => {
    return (itrData?.data || []).filter(
      (i: any) => i.status !== "FILED" && i.status !== "PROCESSED" && i.status !== "VERIFIED"
    );
  }, [itrData?.data]);
  const pendingItrCount = pendingItrList.length;

  const pendingGstList = useMemo(() => {
    return (gstData?.data || []).filter((g: any) => g.status !== "FILED");
  }, [gstData?.data]);
  const pendingGstCount = pendingGstList.length;

  const totalPendingFilings = useMemo(
    () => summary?.pendingFilings ?? (pendingItrCount + pendingGstCount),
    [summary?.pendingFilings, pendingItrCount, pendingGstCount]
  );

  const activeClientsCount = useMemo(
    () => summary?.activeClients ?? summary?.totalClientsActive ?? totalClients,
    [summary?.activeClients, summary?.totalClientsActive, totalClients]
  );

  const totalLeadsCount = useMemo(
    () => summary?.totalLeads ?? (clientsData?.data?.filter((c: any) => c.status === "LEAD").length || 0),
    [summary?.totalLeads, clientsData?.data]
  );

  const overdueInvoices = useMemo(() => {
    return (invoiceData?.data || []).filter((inv: any) => inv.status === "OVERDUE");
  }, [invoiceData?.data]);

  // Tasks Analysis with useMemo
  const allTasks = useMemo(() => tasksData?.data || [], [tasksData?.data]);
  const completedTasks = useMemo(
    () => allTasks.filter((t: any) => t.status === "DONE"),
    [allTasks]
  );
  const pendingTasks = useMemo(
    () => allTasks.filter((t: any) => t.status !== "DONE"),
    [allTasks]
  );

  // Daily Priorities Progress Counter
  const totalDailyActions = useMemo(
    () => pendingTasks.length + pendingGstList.length + pendingItrList.length + overdueInvoices.length,
    [pendingTasks.length, pendingGstList.length, pendingItrList.length, overdueInvoices.length]
  );
  const completedDailyCount = completedTasks.length;
  const totalDailyCount = totalDailyActions + completedDailyCount;
  const dailyProgressPercent = useMemo(
    () => (totalDailyCount > 0 ? Math.round((completedDailyCount / totalDailyCount) * 100) : 100),
    [totalDailyCount, completedDailyCount]
  );

  // Task Toggle Handler wrapped in useCallback
  const handleToggleTask = useCallback(
    async (taskId: string, currentStatus: string) => {
      try {
        const nextStatus = currentStatus === "DONE" ? "TODO" : "DONE";
        await updateTaskStatus({ id: taskId, status: nextStatus }).unwrap();
        refetchSummary();
        refetchTasks();
      } catch (err) {
        console.error("Error toggling task status:", err);
      }
    },
    [updateTaskStatus, refetchSummary, refetchTasks]
  );

  // Weekly Activity Graph Data
  const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const defaultWeeklyActivity: DailyActivityRecord[] = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const list: DailyActivityRecord[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000);
      list.push({
        day: daysShort[d.getDay()],
        date: d.toISOString().split("T")[0],
        filings: 0,
        tasks: 0
      });
    }
    return list;
  }, []);

  const weeklyActivity: DailyActivityRecord[] =
    summary?.weeklyActivity && summary.weeklyActivity.length > 0
      ? summary.weeklyActivity
      : defaultWeeklyActivity;

  const weeklyFilingsTotal = weeklyActivity.reduce((acc, d) => acc + (d.filings || 0), 0);
  const weeklyTasksTotal = weeklyActivity.reduce((acc, d) => acc + (d.tasks || 0), 0);
  const maxWeeklyVal = Math.max(5, ...weeklyActivity.map((d) => Math.max(d.filings || 0, d.tasks || 0)));

  // Combined Pending Filings (GST + ITR) for Modal
  const allPendingFilings = useMemo(() => {
    const now = new Date();
    return [
      ...pendingGstList.map((g: any) => ({
        id: `gst-${g.id}`,
        category: "GST" as const,
        title: `GST ${g.returnType} Return`,
        period: g.period,
        clientName: g.clientName,
        dueDate: g.dueDate ? g.dueDate.split("T")[0] : "Pending",
        status: g.status,
        route: "/gst",
        isOverdue: g.dueDate ? new Date(g.dueDate) < now : false
      })),
      ...pendingItrList.map((i: any) => ({
        id: `itr-${i.id}`,
        category: "ITR" as const,
        title: `ITR Filing (${i.itrFormType})`,
        period: `AY ${i.assessmentYear}`,
        clientName: i.clientName,
        dueDate: i.dueDate ? i.dueDate.split("T")[0] : "Pending",
        status: i.status,
        route: "/itr",
        isOverdue: i.dueDate ? new Date(i.dueDate) < now : false
      }))
    ];
  }, [pendingGstList, pendingItrList]);

  const filteredPendingFilings = useMemo(() => {
    return allPendingFilings.filter((item) => {
      if (pendingFilterTab === "GST" && item.category !== "GST") return false;
      if (pendingFilterTab === "ITR" && item.category !== "ITR") return false;
      if (pendingSearch.trim()) {
        const q = pendingSearch.toLowerCase();
        return (
          item.clientName?.toLowerCase().includes(q) ||
          item.title?.toLowerCase().includes(q) ||
          item.period?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allPendingFilings, pendingFilterTab, pendingSearch]);

  // Operational Priority Items for Live Display with useMemo
  const priorityActionItems = useMemo(() => {
    const items: Array<{
      id: string;
      type: "TASK" | "GST" | "ITR" | "INVOICE";
      title: string;
      clientSubtitle: string;
      actionLabel: string;
      onAction: () => void;
      dotColor: string;
      isCompleted?: boolean;
      rawId?: string;
      status?: string;
    }> = [];

    // 1. Pending Tasks
    pendingTasks.slice(0, 3).forEach((t: any) => {
      items.push({
        id: `task-${t.id}`,
        rawId: t.id,
        status: t.status,
        type: "TASK",
        title: t.title,
        clientSubtitle: `${t.clientName || "General Task"} • Due: ${t.dueDate || "Today"}`,
        actionLabel: "View Task",
        onAction: () => navigate("/tasks"),
        dotColor: t.priority === "HIGH" ? "bg-rose-500" : "bg-primary",
        isCompleted: false
      });
    });

    // 2. Pending GST returns
    pendingGstList.slice(0, 2).forEach((g: any) => {
      items.push({
        id: `gst-${g.id}`,
        type: "GST",
        title: `GST ${g.returnType} Return due on ${g.dueDate?.split("T")[0] || "Upcoming"}`,
        clientSubtitle: `${g.clientName} • Period: ${g.period}`,
        actionLabel: "Prepare Return",
        onAction: () => navigate("/gst"),
        dotColor: "bg-rose-500"
      });
    });

    // 3. Pending ITR filings
    pendingItrList.slice(0, 2).forEach((i: any) => {
      items.push({
        id: `itr-${i.id}`,
        type: "ITR",
        title: `ITR Filing (${i.itrFormType}) Due ${i.dueDate?.split("T")[0] || "Upcoming"}`,
        clientSubtitle: `${i.clientName} • AY ${i.assessmentYear}`,
        actionLabel: "Prepare ITR",
        onAction: () => navigate("/itr"),
        dotColor: "bg-amber-500"
      });
    });

    // 4. Overdue Invoices
    overdueInvoices.slice(0, 2).forEach((inv: any) => {
      items.push({
        id: `inv-${inv.id}`,
        type: "INVOICE",
        title: `Invoice ${inv.invoiceNo} Overdue (₹${inv.total.toLocaleString("en-IN")})`,
        clientSubtitle: `${inv.clientName} • Payment Pending`,
        actionLabel: "Send UPI Link",
        onAction: () => navigate("/billing"),
        dotColor: "bg-rose-500"
      });
    });

    // 5. Show 1-2 recently completed tasks so user sees completion feedback
    completedTasks.slice(0, 2).forEach((t: any) => {
      items.push({
        id: `task-done-${t.id}`,
        rawId: t.id,
        status: t.status,
        type: "TASK",
        title: t.title,
        clientSubtitle: `${t.clientName || "General Task"} • Completed`,
        actionLabel: "Reopen",
        onAction: () => handleToggleTask(t.id, t.status),
        dotColor: "bg-emerald-500",
        isCompleted: true
      });
    });

    return items;
  }, [pendingTasks, pendingGstList, pendingItrList, overdueInvoices, completedTasks, navigate, handleToggleTask]);

  // Compliance percentages
  const itrTotal = itrData?.data?.length || 0;
  const itrFiled = (itrData?.data || []).filter(
    (i: any) => i.status === "FILED" || i.status === "PROCESSED" || i.status === "VERIFIED"
  ).length;
  const itrPercentage = itrTotal > 0 ? Math.round((itrFiled / itrTotal) * 100) : 0;

  const gstTotal = gstData?.data?.length || 0;
  const gstFiled = (gstData?.data || []).filter((g: any) => g.status === "FILED").length;
  const gstPercentage = gstTotal > 0 ? Math.round((gstFiled / gstTotal) * 100) : 0;

  const tasksTotal = allTasks.length;
  const tasksPercentage = tasksTotal > 0 ? Math.round((completedTasks.length / tasksTotal) * 100) : 0;

  // Upcoming statutory deadlines sorted chronologically with high-contrast theme badges
  const upcomingDeadlines = useMemo(() => {
    const rawList = [
      ...pendingGstList.map((g: any) => ({
        title: `GST ${g.returnType} (${g.period})`,
        client: g.clientName,
        due: g.dueDate ? g.dueDate.split("T")[0] : "Pending",
        dueTimestamp: g.dueDate ? new Date(g.dueDate).getTime() : Infinity,
        badgeColor: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50"
      })),
      ...pendingItrList.map((i: any) => ({
        title: `ITR ${i.itrFormType} (${i.assessmentYear})`,
        client: i.clientName,
        due: i.dueDate ? i.dueDate.split("T")[0] : "Pending",
        dueTimestamp: i.dueDate ? new Date(i.dueDate).getTime() : Infinity,
        badgeColor: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50"
      }))
    ];
    return rawList
      .sort((a, b) => a.dueTimestamp - b.dueTimestamp)
      .slice(0, 3);
  }, [pendingGstList, pendingItrList]);

  const urgentCount = totalDailyActions;

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Practice overview"
        title={`Welcome back${user?.name ? `, ${user.name}` : ""}`}
        description={
          urgentCount > 0
            ? `${urgentCount} actionable item${urgentCount > 1 ? "s" : ""} need attention across filings, tasks, and payments.`
            : "All returns, documents, and payments are up to date across your practice."
        }
        actions={
          <>
            <Button size="sm" onClick={() => navigate("/clients")} leftIcon={<Plus className="w-4 h-4" />}>
              Add Client
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/ai-assistant")}
              leftIcon={<Bot className="w-4 h-4 text-primary" />}
            >
              Ask TaxFlow AI
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isSummaryLoading ? (
          <>
            {[1, 2, 3, 4].map((n) => (
              <Card key={n} className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="h-3.5 bg-muted rounded w-24" />
                  <div className="w-8 h-8 bg-muted rounded-lg" />
                </div>
                <div className="mt-3 space-y-2">
                  <div className="h-7 bg-muted rounded w-16" />
                  <div className="h-3 bg-muted rounded w-28" />
                </div>
              </Card>
            ))}
          </>
        ) : (
          <>
            <MetricCard
              label="Total Revenue"
              value={`₹${(summary?.totalRevenue ?? 0).toLocaleString("en-IN")}`}
              icon={<IndianRupee className="w-4 h-4" />}
              trend={
                summary?.totalRevenueComparison ||
                (summary && summary.totalRevenueThisMonth > 0
                  ? `₹${summary.totalRevenueThisMonth.toLocaleString("en-IN")} this month`
                  : undefined)
              }
              hint={!summary?.totalRevenueComparison && !(summary && summary.totalRevenueThisMonth > 0) ? "All-time collected" : undefined}
              trendTone={summary?.totalRevenueComparison || (summary && summary.totalRevenueThisMonth > 0) ? "positive" : "neutral"}
              onClick={() => navigate("/billing?status=PAID")}
            />
            <MetricCard
              label="Active Clients"
              value={activeClientsCount}
              icon={<Users className="w-4 h-4" />}
              trend={summary?.activeClientsComparison}
              hint={!summary?.activeClientsComparison ? "Active client accounts" : undefined}
              trendTone={summary?.activeClientsComparison ? "positive" : "neutral"}
              onClick={() => navigate("/clients?status=ACTIVE")}
            />
            <MetricCard
              label="Pending Filings"
              value={totalPendingFilings}
              icon={<Clock className="w-4 h-4" />}
              trend={
                totalPendingFilings > 0
                  ? (summary?.pendingFilingsOverdue ?? 0) > 0
                    ? `Requires action · ${summary?.pendingFilingsOverdue} overdue`
                    : "Requires action"
                  : undefined
              }
              hint={totalPendingFilings === 0 ? "All filings up to date" : undefined}
              trendTone={totalPendingFilings > 0 ? "negative" : "neutral"}
              onClick={() => navigate("/itr?status=pending")}
            />
            <MetricCard
              label="Total Leads"
              value={totalLeadsCount}
              icon={<UserPlus className="w-4 h-4" />}
              trend={
                summary && summary.newLeadsThisMonth > 0
                  ? `${summary.newLeadsThisMonth} new this month`
                  : undefined
              }
              hint={
                !(summary && summary.newLeadsThisMonth > 0)
                  ? summary && summary.totalLeads > 0
                    ? "Prospective clients"
                    : "No active leads"
                  : undefined
              }
              trendTone={summary && summary.newLeadsThisMonth > 0 ? "positive" : "neutral"}
              onClick={() => navigate("/clients?status=LEAD")}
            />
          </>
        )}
      </div>

      {/* Live Task Dashboard & Weekly Activity Graph Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 cols): Live Task Dashboard */}
        <div className="lg:col-span-7 min-w-0">
          <Card className="h-full flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-primary-muted text-primary rounded-lg">
                    <ListTodo className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-foreground">Live Task Dashboard</h2>
                      <span className="px-2 py-0.5 rounded-full bg-primary-muted border border-primary/20 text-primary text-[11px] font-bold">
                        {completedDailyCount}/{totalDailyCount} completed
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Daily priorities & pending actions
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsPendingModalOpen(true)}
                  leftIcon={<FileCheck className="w-3.5 h-3.5 text-primary" />}
                  className="text-xs border-primary/20 text-primary hover:bg-primary-muted font-semibold self-start sm:self-auto"
                >
                  See all pending GST & ITR {allPendingFilings.length > 0 ? `(${allPendingFilings.length})` : ""}
                </Button>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex justify-between items-center text-[10px] text-muted-foreground font-medium mb-1">
                  <span>Daily Action Progress</span>
                  <span className="font-bold text-foreground/80">{dailyProgressPercent}% completed</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary to-emerald-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${dailyProgressPercent}%` }}
                  />
                </div>
              </div>

              {/* Items List */}
              {priorityActionItems.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2.5">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-foreground">All Daily Priorities Completed!</h4>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-sm mx-auto">
                    0/0 daily actions pending. All returns, documents, and firm tasks are completely up to date.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsPendingModalOpen(true)}
                      className="text-xs"
                      leftIcon={<FileCheck className="w-3.5 h-3.5 text-primary" />}
                    >
                      See all pending GST & ITR
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => navigate("/tasks")}
                      className="text-xs shadow-xs"
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Add Task
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-border mt-2 max-h-[340px] overflow-y-auto pr-1">
                  {priorityActionItems.map((item) => (
                    <div
                      key={item.id}
                      className={`py-2.5 px-2 flex items-center justify-between gap-2.5 rounded-lg transition-smooth hover:bg-muted/60 ${
                        item.isCompleted ? "opacity-60 bg-muted/40" : ""
                      }`}
                    >
                      <div className="flex items-start space-x-3 min-w-0 flex-1 pr-1">
                        {item.type === "TASK" ? (
                          <button
                            onClick={() => item.rawId && handleToggleTask(item.rawId, item.status || "TODO")}
                            disabled={isUpdatingTask}
                            className="mt-0.5 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                            title={item.isCompleted ? "Mark incomplete" : "Mark completed"}
                          >
                            {item.isCompleted ? (
                              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Circle className="w-4 h-4 text-muted-foreground dark:text-slate-600 hover:text-primary" />
                            )}
                          </button>
                        ) : (
                          <span className={`w-2 h-2 rounded-full ${item.dotColor} mt-1.5 flex-shrink-0`} />
                        )}

                        <div className="min-w-0 flex-1">
                          <h4
                            className={`text-xs font-bold text-foreground truncate ${
                              item.isCompleted ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            {item.title}
                          </h4>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {item.clientSubtitle}
                          </p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant={item.isCompleted ? "secondary" : "outline"}
                        onClick={item.onAction}
                        className="text-xs flex-shrink-0"
                      >
                        {item.actionLabel}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Summary */}
            <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {urgentCount > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    ⚠️ {urgentCount} urgent filing/task item{urgentCount > 1 ? "s" : ""} require action
                  </span>
                ) : (
                  "All daily compliance actions cleared"
                )}
              </span>
              <button
                onClick={() => navigate("/tasks")}
                className="text-primary hover:text-primary font-semibold hover:underline"
              >
                Go to Task Kanban →
              </button>
            </div>
          </Card>
        </div>


        {/* Right (5 cols): Weekly Activity Graph */}
        <div className="lg:col-span-5 min-w-0">
          <Card className="h-full flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-primary-muted text-primary rounded-lg">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Weekly Activity</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Tasks & filings this week</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-primary-muted border border-primary/20 text-primary text-[10px] font-bold">
                    {weeklyFilingsTotal} Filings
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                    {weeklyTasksTotal} Tasks
                  </span>
                </div>
              </div>

              {/* Interactive SVG Bar Graph */}
              <div className="relative pt-4 pb-1">
                {/* Dynamic Tooltip on Hover */}
                {hoveredDayIndex !== null && weeklyActivity[hoveredDayIndex] && (
                  <div className="absolute top-0 right-0 bg-slate-900 dark:bg-slate-800 text-white text-[10px] px-2.5 py-1 rounded-md shadow-md z-10 animate-in fade-in duration-150 pointer-events-none flex items-center gap-2 font-medium border border-border">
                    <span className="text-muted-foreground">
                      {weeklyActivity[hoveredDayIndex].day} ({weeklyActivity[hoveredDayIndex].date}):
                    </span>
                    <span className="text-primary font-bold">
                      {weeklyActivity[hoveredDayIndex].filings} Filings
                    </span>
                    <span className="text-emerald-400 font-bold">
                      {weeklyActivity[hoveredDayIndex].tasks} Tasks
                    </span>
                  </div>
                )}

                <svg viewBox="0 0 420 160" preserveAspectRatio="xMidYMid meet" className="w-full h-44 overflow-hidden block">
                  {/* Horizontal Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const y = 135 - ratio * 110;
                    const val = Math.round(ratio * maxWeeklyVal);
                    return (
                      <g key={idx}>
                        <line
                          x1="25"
                          y1={y}
                          x2="415"
                          y2={y}
                          className="stroke-slate-100 dark:stroke-slate-800"
                          strokeDasharray="3 3"
                          strokeWidth="1"
                        />
                        <text x="5" y={y + 3} className="fill-slate-400 text-[9px] font-medium">
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Day Columns */}
                  {weeklyActivity.map((day, idx) => {
                    const slotWidth = (415 - 35) / weeklyActivity.length;
                    const cx = 35 + idx * slotWidth + slotWidth / 2;
                    const filingsHeight = maxWeeklyVal > 0 ? (day.filings / maxWeeklyVal) * 110 : 0;
                    const tasksHeight = maxWeeklyVal > 0 ? (day.tasks / maxWeeklyVal) * 110 : 0;
                    const isHovered = hoveredDayIndex === idx;
                    const isToday = idx === weeklyActivity.length - 1;

                    return (
                      <g
                        key={idx}
                        onMouseEnter={() => setHoveredDayIndex(idx)}
                        onMouseLeave={() => setHoveredDayIndex(null)}
                        className="cursor-pointer"
                      >
                        {/* Hover column backdrop */}
                        <rect
                          x={cx - slotWidth / 2 + 2}
                          y="15"
                          width={slotWidth - 4}
                          height="125"
                          className={isHovered ? "fill-slate-100 dark:fill-slate-800/60" : "fill-transparent"}
                          rx="4"
                        />

                        {/* Filings Bar (Blue) */}
                        <rect
                          x={cx - 9}
                          y={135 - Math.max(day.filings > 0 ? filingsHeight : 3, 3)}
                          width="7"
                          height={Math.max(day.filings > 0 ? filingsHeight : 3, 3)}
                          fill={day.filings > 0 ? "#3b82f6" : "#cbd5e1"}
                          className="transition-all duration-300"
                          rx="3"
                        />

                        {/* Tasks Bar (Emerald) */}
                        <rect
                          x={cx + 2}
                          y={135 - Math.max(day.tasks > 0 ? tasksHeight : 3, 3)}
                          width="7"
                          height={Math.max(day.tasks > 0 ? tasksHeight : 3, 3)}
                          fill={day.tasks > 0 ? "#10b981" : "#cbd5e1"}
                          className="transition-all duration-300"
                          rx="3"
                        />

                        {/* X-axis Day Label */}
                        <text
                          x={cx}
                          y="152"
                          textAnchor="middle"
                          className={
                            isToday
                              ? "fill-primary font-bold text-[10px]"
                              : isHovered
                              ? "fill-slate-900 dark:fill-white font-bold text-[10px]"
                              : "fill-slate-400 text-[10px] font-medium"
                          }
                        >
                          {day.day}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center justify-center gap-5 pt-2 border-t border-border text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-xs bg-primary inline-block" />
                  <span>GST & ITR Filings</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
                  <span>Tasks Completed</span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-[10px] text-muted-foreground text-center">
              Real-time daily activity tracking for the past 7 days
            </div>
          </Card>
        </div>
      </div>

      {/* Secondary Row: Compliance Health & AI Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Compliance Health Progress */}
        <div className="lg:col-span-2 min-w-0">
          <Card>
            <h3 className="text-sm font-bold text-foreground mb-4">Firm Compliance Health Overview</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-foreground/80">ITR Filing Progress (AY 2026-27)</span>
                  <span className="text-primary font-bold">
                    {itrTotal > 0 ? `${itrPercentage}%` : "100% (No pending)"}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${itrTotal > 0 ? itrPercentage : 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-foreground/80">GST Monthly Compliance</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {gstTotal > 0 ? `${gstPercentage}%` : "100% (No pending)"}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${gstTotal > 0 ? gstPercentage : 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-foreground/80">Task Completion Rate</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                    {tasksTotal > 0 ? `${tasksPercentage}%` : "100% (No pending)"}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${tasksTotal > 0 ? tasksPercentage : 100}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (1 col): AI Insights & Statutory Deadlines */}
        <div className="space-y-6 min-w-0">
          {/* AI Practice Insight Card */}
          <Card className="bg-primary-muted/40 border-primary/20">
            <div className="flex items-center space-x-2 text-primary mb-2">
              <Bot className="w-5 h-5" />
              <h3 className="text-xs font-bold uppercase tracking-wider">AI Practice Insights</h3>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed font-medium">
              {urgentCount > 0
                ? `${urgentCount} compliance and operational item${
                    urgentCount > 1 ? "s" : ""
                  } currently require firm attention. Review deadlines and assign pending tasks.`
                : "All client compliance records, statutory returns, and invoicing are in good health with zero pending alerts."}
            </p>
            <div className="mt-4">
              <Button
                size="sm"
                onClick={() => navigate("/ai-assistant")}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold"
              >
                Ask TaxFlow AI
              </Button>
            </div>
          </Card>

          {/* Upcoming Statutory Deadlines */}
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Upcoming Statutory Deadlines
              </h3>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </div>

            {upcomingDeadlines.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                No upcoming statutory deadlines scheduled.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-foreground">{item.title}</span>
                      <p className="text-[10px] text-muted-foreground">{item.client}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${item.badgeColor}`}>
                      {item.due}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* "See all pending GST & ITR" Comprehensive Modal */}
      <Modal
        isOpen={isPendingModalOpen}
        onClose={() => setIsPendingModalOpen(false)}
        title="All Pending GST Returns & ITR Filings"
        maxWidth="xl"
      >
        <div className="space-y-4">
          {/* Header Description & Search Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setPendingFilterTab("ALL")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-smooth ${
                  pendingFilterTab === "ALL"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground dark:hover:text-white"
                }`}
              >
                All Pending ({allPendingFilings.length})
              </button>
              <button
                onClick={() => setPendingFilterTab("GST")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-smooth ${
                  pendingFilterTab === "GST"
                    ? "bg-card text-primary shadow-2xs"
                    : "text-muted-foreground hover:text-foreground dark:hover:text-white"
                }`}
              >
                GST Returns ({pendingGstCount})
              </button>
              <button
                onClick={() => setPendingFilterTab("ITR")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-smooth ${
                  pendingFilterTab === "ITR"
                    ? "bg-card text-amber-700 dark:text-amber-300 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground dark:hover:text-white"
                }`}
              >
                ITR Filings ({pendingItrCount})
              </button>
            </div>

            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search client or return..."
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Filings List */}
          <div className="max-h-[60vh] overflow-y-auto divide-y divide-border border border-border rounded-xl bg-muted/30">
            {filteredPendingFilings.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-foreground">No Pending Filings Found</h4>
                <p className="text-[11px] text-muted-foreground mt-1 max-w-sm mx-auto">
                  {allPendingFilings.length === 0
                    ? "All client GST returns and ITR filings have been processed and completed."
                    : "No pending returns match your search filter."}
                </p>
              </div>
            ) : (
              filteredPendingFilings.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted transition-smooth"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`p-2 rounded-lg mt-0.5 flex-shrink-0 ${
                        item.category === "GST"
                          ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                          : "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {item.category === "GST" ? <Clock className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-foreground truncate">{item.title}</h4>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            item.category === "GST"
                              ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300"
                              : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
                          }`}
                        >
                          {item.period}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 font-medium truncate">{item.clientName}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] text-muted-foreground">Due: {item.dueDate}</span>
                        {item.isOverdue && (
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">• OVERDUE</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsPendingModalOpen(false);
                      navigate(item.route);
                    }}
                    rightIcon={<ArrowUpRight className="w-3 h-3" />}
                    className="text-xs self-end sm:self-auto flex-shrink-0"
                  >
                    Open Return
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-muted-foreground">
            <span>
              Showing {filteredPendingFilings.length} of {allPendingFilings.length} pending filings
            </span>
            <Button size="sm" variant="secondary" onClick={() => setIsPendingModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

