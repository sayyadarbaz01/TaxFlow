import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Calendar, CheckCircle2, Clock, Filter, AlertCircle } from "lucide-react";
import { useGetGstReturnsQuery, useGetUpcomingGstDueQuery, useMarkGstFiledMutation } from "../../lib/api";
import { Table, Column } from "../../components/ui/Table";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { GstReturnRecord } from "@ca-saas/shared-types";
import { PageHeader } from "../../components/ui/PageHeader";

export const GstDashboardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [returnTypeFilter, setReturnTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");

  useEffect(() => {
    const s = searchParams.get("status");
    if (s !== null) {
      setStatusFilter(s);
    }
  }, [searchParams]);

  const { data, isLoading } = useGetGstReturnsQuery({
    returnType: returnTypeFilter || undefined,
    status: statusFilter || undefined
  });
  const { data: upcomingData } = useGetUpcomingGstDueQuery({});

  const [markGstFiled, { isLoading: isMarking }] = useMarkGstFiledMutation();

  const handleMarkFiled = async (id: string) => {
    try {
      await markGstFiled(id).unwrap();
    } catch (err: any) {
      alert(err.data?.error?.message || "Filing submission failed");
    }
  };

  const columns: Column<GstReturnRecord>[] = [
    {
      header: "Client Name",
      cell: (row) => (
        <div>
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-foreground text-xs">{row.clientName}</p>
            {row.workType === "ITR + GST" && (
              <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-primary-muted text-primary border border-primary/20">
                ITR + GST
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">{row.period}</span>
        </div>
      )
    },
    {
      header: "Return Type",
      cell: (row) => (
        <span className="font-bold text-xs px-2 py-0.5 rounded bg-primary-muted text-primary border border-primary/20">
          {row.returnType} ({row.filingFrequency})
        </span>
      )
    },
    {
      header: "Due Date",
      cell: (row) => <span className="font-mono text-xs font-semibold text-foreground">{row.dueDate}</span>
    },
    {
      header: "Filing Status",
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: "Action",
      cell: (row) => (
        row.status !== "FILED" ? (
          <Button
            size="sm"
            isLoading={isMarking}
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            onClick={() => handleMarkFiled(row.id)}
          >
            Mark Filed (GSP Adapter)
          </Button>
        ) : (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Filed ({new Date(row.filedAt!).toLocaleDateString()})
          </span>
        )
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="GST Returns"
        description="Recurring GSTR-1, GSTR-3B, PMT-06, and GSTR-9 statutory return schedules."
      />

      {/* Upcoming Due Returns Banner */}
      <Card className="bg-card border-border">
        <div className="flex items-center space-x-2 text-primary mb-2">
          <Calendar className="w-4 h-4" />
          <h3 className="text-xs font-bold uppercase tracking-wider">Upcoming GST Deadlines (Next 30 Days)</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mt-3">
          {upcomingData?.slice(0, 3).map((item: any) => (
            <div key={item.id} className="p-2.5 bg-muted rounded-lg border border-border">
              <p className="font-bold text-foreground truncate">{item.clientName}</p>
              <p className="text-[10px] text-muted-foreground font-mono">{item.returnType} • {item.period}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Due: {item.dueDate}</span>
                <StatusBadge status={item.status} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-2 text-xs">
        <div className="flex space-x-2 overflow-x-auto pb-1">
          {["", "due", "PENDING", "OVERDUE", "FILED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-smooth ${
                statusFilter === st
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {st === "due" ? "Due / Approaching" : st || "All Statuses"}
            </button>
          ))}
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-1">
          {["", "GSTR1", "GSTR3B", "GSTR9"].map((rt) => (
            <button
              key={rt}
              onClick={() => setReturnTypeFilter(rt)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-smooth ${
                returnTypeFilter === rt
                  ? "bg-primary text-white shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {rt || "All Forms"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Table columns={columns} data={data?.data || []} isLoading={isLoading} emptyText="No GST returns found." />
    </div>
  );
};
