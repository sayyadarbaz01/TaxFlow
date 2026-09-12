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

  // Operational Priority Items for Live Display
  const priorityActionItems: Array<{
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
    priorityActionItems.push({
      id: `task-${t.id}`,
      rawId: t.id,
      status: t.status,
      type: "TASK",
      title: t.title,
      clientSubtitle: `${t.clientName || "General Task"} • Due: ${t.dueDate || "Today"}`,
      actionLabel: "View Task",
      onAction: () => navigate("/tasks"),
      dotColor: t.priority === "HIGH" ? "bg-rose-500" : "bg-blue-500",
      isCompleted: false
    });
  });

  // 2. Pending GST returns
  pendingGstList.slice(0, 2).forEach((g: any) => {
    priorityActionItems.push({
      id: `gst-${g.id}`,
      type: "GST",
      title: `GST ${g.returnType} Return due on ${g.dueDate?.split("T")[0]}`,
      clientSubtitle: `${g.clientName} • Period: ${g.period}`,
      actionLabel: "Prepare Return",
      onAction: () => navigate("/gst"),
      dotColor: "bg-rose-500"
    });
  });

  // 3. Pending ITR filings
  pendingItrList.slice(0, 2).forEach((i: any) => {
    priorityActionItems.push({
      id: `itr-${i.id}`,
      type: "ITR",
      title: `ITR Filing (${i.itrFormType}) Due ${i.dueDate?.split("T")[0]}`,
      clientSubtitle: `${i.clientName} • AY ${i.assessmentYear}`,
      actionLabel: "Prepare ITR",
      onAction: () => navigate("/itr"),
      dotColor: "bg-amber-500"
    });
  });

  // 4. Overdue Invoices
  overdueInvoices.slice(0, 2).forEach((inv: any) => {
    priorityActionItems.push({
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
    priorityActionItems.push({
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

  // Upcoming statutory deadlines
  const upcomingDeadlines = [
    ...pendingGstList.map((g: any) => ({
      title: `GST ${g.returnType} (${g.period})`,
      client: g.clientName,
      due: g.dueDate?.split("T")[0],
      badgeColor: "bg-rose-50 text-rose-700"
    })),
    ...pendingItrList.map((i: any) => ({
      title: `ITR ${i.itrFormType} (${i.assessmentYear})`,
      client: i.clientName,
      due: i.dueDate?.split("T")[0],
      badgeColor: "bg-amber-50 text-amber-700"
    }))
  ].slice(0, 3);

  const urgentCount = totalDailyActions;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Welcome back{user?.name ? `, ${user.name}` : ""} 👋
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            {urgentCount > 0
              ? `Here's what's happening across your CA practice today. ${urgentCount} actionable item${
                  urgentCount > 1 ? "s" : ""
                } require attention.`
              : "Here's what's happening across your CA practice today. All returns, documents, and payments are up to date."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={() => navigate("/clients")}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold"
          >
            Add Client
          </Button>
          <Button
            size="sm"
            onClick={() => navigate("/ai-assistant")}
            variant="outline"
            leftIcon={<Bot className="w-4 h-4 text-blue-400" />}
            className="border-slate-700 text-white hover:bg-slate-800 font-semibold"
          >
            Ask AI
          </Button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isSummaryLoading ? (
          <>
            {[1, 2, 3, 4].map((n) => (
              <Card key={n} className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="h-3.5 bg-slate-200 rounded w-24" />
                  <div className="w-8 h-8 bg-slate-200 rounded-lg" />
                </div>
                <div className="mt-3 space-y-2">
                  <div className="h-7 bg-slate-200 rounded w-16" />
                  <div className="h-3 bg-slate-100 rounded w-28" />
                </div>
              </Card>
            ))}
          </>
        ) : (
          <>
            {/* 1. Total Revenue */}
            <Card
              onClick={() => navigate("/billing?status=PAID")}
              className="hover:border-emerald-300 transition-smooth cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Revenue</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-900">
                  ₹{(summary?.totalRevenue ?? 0).toLocaleString("en-IN")}
                </span>
                {summary?.totalRevenueComparison ? (
                  <div className="flex items-center text-[10px] text-emerald-600 font-semibold mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {summary.totalRevenueComparison}
                  </div>
                ) : summary && summary.totalRevenueThisMonth > 0 ? (
                  <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                    ₹{summary.totalRevenueThisMonth.toLocaleString("en-IN")} this month
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">All-time collected</p>
                )}
              </div>
            </Card>

            {/* 2. Active Clients */}
            <Card
              onClick={() => navigate("/clients?status=ACTIVE")}
              className="hover:border-blue-300 transition-smooth cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Active Clients</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-900">
                  {summary?.activeClients ?? summary?.totalClientsActive ?? totalClients ?? 0}
                </span>
                {summary?.activeClientsComparison ? (
                  <div className="flex items-center text-[10px] text-emerald-600 font-semibold mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {summary.activeClientsComparison}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">Active client accounts</p>
                )}
              </div>
            </Card>

            {/* 3. Pending Filings */}
            <Card
              onClick={() => navigate("/itr?status=pending")}
              className="hover:border-amber-300 transition-smooth cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Pending Filings</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-900">
                  {summary?.pendingFilings ?? (pendingItrCount + pendingGstCount) ?? 0}
                </span>
                {summary && summary.pendingFilings > 0 ? (
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[10px] text-amber-600 font-semibold">Requires action</span>
                    {summary.pendingFilingsOverdue > 0 && (
                      <span className="text-[10px] text-rose-600 font-bold">
                        • {summary.pendingFilingsOverdue} overdue
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">All filings up to date</p>
                )}
              </div>
            </Card>

            {/* 4. Total Leads */}
            <Card
              onClick={() => navigate("/clients?status=LEAD")}
              className="hover:border-purple-300 transition-smooth cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Leads</span>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <UserPlus className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-900">
                  {summary?.totalLeads ?? (clientsData?.data?.filter((c: any) => c.status === "LEAD").length || 0)}
                </span>
                {summary && summary.newLeadsThisMonth > 0 ? (
                  <div className="flex items-center text-[10px] text-purple-600 font-semibold mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {summary.newLeadsThisMonth} new this month
                  </div>
                ) : summary && summary.totalLeads > 0 ? (
                  <p className="text-[10px] text-purple-600 font-semibold mt-1">Prospective clients</p>
                ) : (
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">No active leads</p>
                )}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Live Task Dashboard & Weekly Activity Graph Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 cols): Live Task Dashboard */}
        <div className="lg:col-span-7">
          <Card className="h-full flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <ListTodo className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900">Live Task Dashboard</h2>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold">
                        {completedDailyCount}/{totalDailyCount} completed
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Daily priorities & pending actions
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsPendingModalOpen(true)}
                  leftIcon={<FileCheck className="w-3.5 h-3.5 text-blue-600" />}
                  className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 font-semibold self-start sm:self-auto"
                >
                  See all pending GST & ITR {allPendingFilings.length > 0 ? `(${allPendingFilings.length})` : ""}
                </Button>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium mb-1">
                  <span>Daily Action Progress</span>
                  <span className="font-bold text-slate-700">{dailyProgressPercent}% completed</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-emerald-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${dailyProgressPercent}%` }}
                  />
                </div>
              </div>

              {/* Items List */}
              {priorityActionItems.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2.5">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">All Daily Priorities Completed!</h4>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                    0/0 daily actions pending. All returns, documents, and firm tasks are completely up to date.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsPendingModalOpen(true)}
                      className="text-xs"
                      leftIcon={<FileCheck className="w-3.5 h-3.5 text-blue-600" />}
                    >
                      See all pending GST & ITR
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => navigate("/tasks")}
                      className="text-xs bg-blue-600 hover:bg-blue-500 text-white"
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Add Task
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 mt-3">
                  {priorityActionItems.map((item) => (
                    <div
                      key={item.id}
                      className={`py-2.5 px-2 flex items-center justify-between rounded-lg transition-smooth hover:bg-slate-50 ${
                        item.isCompleted ? "opacity-60 bg-slate-50/50" : ""
                      }`}
                    >
                      <div className="flex items-start space-x-3 min-w-0 pr-2">
                        {item.type === "TASK" ? (
                          <button
                            onClick={() => item.rawId && handleToggleTask(item.rawId, item.status || "TODO")}
                            disabled={isUpdatingTask}
                            className="mt-0.5 text-slate-400 hover:text-blue-600 transition-colors flex-shrink-0"
                            title={item.isCompleted ? "Mark incomplete" : "Mark completed"}
                          >
                            {item.isCompleted ? (
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-300 hover:text-blue-500" />
                            )}
                          </button>
                        ) : (
                          <span className={`w-2 h-2 rounded-full ${item.dotColor} mt-1.5 flex-shrink-0`} />
                        )}

                        <div className="min-w-0">
                          <h4
                            className={`text-xs font-bold text-slate-900 truncate ${
                              item.isCompleted ? "line-through text-slate-500" : ""
                            }`}
                          >
                            {item.title}
                          </h4>
                          <p className="text-[10px] text-slate-500 truncate">{item.clientSubtitle}</p>
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
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>
                {urgentCount > 0
                  ? `${urgentCount} urgent action${urgentCount > 1 ? "s" : ""} pending firm attention`
                  : "All daily compliance actions cleared"}
              </span>
              <button
                onClick={() => navigate("/tasks")}
                className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
              >
                Go to Task Kanban →
              </button>
            </div>
          </Card>
        </div>

        {/* Right (5 cols): Weekly Activity Graph */}
        <div className="lg:col-span-5">
          <Card className="h-full flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Weekly Activity</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Tasks & filings this week</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold">
                    {weeklyFilingsTotal} Filings
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                    {weeklyTasksTotal} Tasks
                  </span>
                </div>
              </div>

              {/* Interactive SVG Bar Graph */}
              <div className="relative pt-4 pb-1">
                {/* Dynamic Tooltip on Hover */}
                {hoveredDayIndex !== null && weeklyActivity[hoveredDayIndex] && (
                  <div className="absolute top-0 right-0 bg-slate-900 text-white text-[10px] px-2.5 py-1 rounded-md shadow-md z-10 animate-in fade-in duration-150 pointer-events-none flex items-center gap-2 font-medium">
                    <span className="text-slate-300">
                      {weeklyActivity[hoveredDayIndex].day} ({weeklyActivity[hoveredDayIndex].date}):
                    </span>
                    <span className="text-blue-400 font-bold">
                      {weeklyActivity[hoveredDayIndex].filings} Filings
                    </span>
                    <span className="text-emerald-400 font-bold">
                      {weeklyActivity[hoveredDayIndex].tasks} Tasks
                    </span>
                  </div>
                )}

                <svg viewBox="0 0 420 160" className="w-full h-44 overflow-visible">
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
                          stroke="#f1f5f9"
                          strokeDasharray="3 3"
                          strokeWidth="1"
                        />
                        <text x="5" y={y + 3} fill="#94a3b8" fontSize="9" fontWeight="500">
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
                          fill={isHovered ? "#f8fafc" : "transparent"}
                          rx="4"
                        />

                        {/* Filings Bar (Blue) */}
                        <rect
                          x={cx - 9}
                          y={135 - Math.max(day.filings > 0 ? filingsHeight : 3, 3)}
                          width="7"
                          height={Math.max(day.filings > 0 ? filingsHeight : 3, 3)}
                          fill={day.filings > 0 ? "#3b82f6" : "#e2e8f0"}
                          rx="3"
                          className="transition-all duration-300"
                        />

                        {/* Tasks Bar (Emerald) */}
                        <rect
                          x={cx + 2}
                          y={135 - Math.max(day.tasks > 0 ? tasksHeight : 3, 3)}
                          width="7"
                          height={Math.max(day.tasks > 0 ? tasksHeight : 3, 3)}
                          fill={day.tasks > 0 ? "#10b981" : "#e2e8f0"}
                          rx="3"
                          className="transition-all duration-300"
                        />

                        {/* X-axis Day Label */}
                        <text
                          x={cx}
                          y="152"
                          textAnchor="middle"
                          fill={isToday ? "#2563eb" : isHovered ? "#0f172a" : "#64748b"}
                          fontSize="10"
                          fontWeight={isToday || isHovered ? "700" : "500"}
                        >
                          {day.day}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center justify-center gap-5 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
                  <span>GST & ITR Filings</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                  <span>Tasks Completed</span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-[10px] text-slate-400 text-center">
              Real-time daily activity tracking for the past 7 days
            </div>
          </Card>
        </div>
      </div>

      {/* Secondary Row: Compliance Health & AI Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Compliance Health Progress */}
        <div className="lg:col-span-2">
          <Card>
            <h3 className="text-sm font-bold text-slate-900 mb-4">Firm Compliance Health Overview</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">ITR Filing Progress (AY 2026-27)</span>
                  <span className="text-blue-600 font-bold">
                    {itrTotal > 0 ? `${itrPercentage}%` : "100% (No pending)"}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${itrTotal > 0 ? itrPercentage : 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">GST Monthly Compliance</span>
                  <span className="text-emerald-600 font-bold">
                    {gstTotal > 0 ? `${gstPercentage}%` : "100% (No pending)"}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${gstTotal > 0 ? gstPercentage : 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Task Completion Rate</span>
                  <span className="text-amber-600 font-bold">
                    {tasksTotal > 0 ? `${tasksPercentage}%` : "100% (No pending)"}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
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
        <div className="space-y-6">
          {/* AI Practice Insight Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center space-x-2 text-blue-700 mb-2">
              <Bot className="w-5 h-5" />
              <h3 className="text-xs font-bold uppercase tracking-wider">AI Practice Insights</h3>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                Review Insights with AI
              </Button>
            </div>
          </Card>

          {/* Upcoming Statutory Deadlines */}
          <Card>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Upcoming Statutory Deadlines
              </h3>
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>

            {upcomingDeadlines.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500">
                No upcoming statutory deadlines scheduled.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-900">{item.title}</span>
                      <p className="text-[10px] text-slate-500">{item.client}</p>
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
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setPendingFilterTab("ALL")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-smooth ${
                  pendingFilterTab === "ALL" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Pending ({allPendingFilings.length})
              </button>
              <button
                onClick={() => setPendingFilterTab("GST")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-smooth ${
                  pendingFilterTab === "GST" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                GST Returns ({pendingGstCount})
              </button>
              <button
                onClick={() => setPendingFilterTab("ITR")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-smooth ${
                  pendingFilterTab === "ITR" ? "bg-white text-amber-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ITR Filings ({pendingItrCount})
              </button>
            </div>

            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search client or return..."
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filings List */}
          <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50/50">
            {filteredPendingFilings.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">No Pending Filings Found</h4>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                  {allPendingFilings.length === 0
                    ? "All client GST returns and ITR filings have been processed and completed."
                    : "No pending returns match your search filter."}
                </p>
              </div>
            ) : (
              filteredPendingFilings.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-white flex items-center justify-between hover:bg-slate-50 transition-smooth"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg mt-0.5 ${
                        item.category === "GST" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {item.category === "GST" ? <Clock className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            item.category === "GST" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {item.period}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 font-medium">{item.clientName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-500">Due: {item.dueDate}</span>
                        {item.isOverdue && (
                          <span className="text-[10px] text-rose-600 font-bold">• OVERDUE</span>
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
                    className="text-xs"
                  >
                    Open Return
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
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
