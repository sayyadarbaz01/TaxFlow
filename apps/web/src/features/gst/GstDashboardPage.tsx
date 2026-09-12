import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Calendar, CheckCircle2, Clock, Filter, AlertCircle } from "lucide-react";
import { useGetGstReturnsQuery, useGetUpcomingGstDueQuery, useMarkGstFiledMutation } from "../../lib/api";
import { Table, Column } from "../../components/ui/Table";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { GstReturnRecord } from "@ca-saas/shared-types";

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
            <p className="font-semibold text-slate-900 text-xs">{row.clientName}</p>
            {row.workType === "ITR + GST" && (
              <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                ITR + GST
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-slate-500">{row.period}</span>
        </div>
      )
    },
    {
      header: "Return Type",
      cell: (row) => (
        <span className="font-bold text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
          {row.returnType} ({row.filingFrequency})
        </span>
      )
    },
    {
      header: "Due Date",
      cell: (row) => <span className="font-mono text-xs font-semibold text-slate-800">{row.dueDate}</span>
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
          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Filed ({new Date(row.filedAt!).toLocaleDateString()})
          </span>
        )
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">GST Compliance Center</h1>
          <p className="text-xs text-slate-500 mt-1">Recurring GSTR-1, GSTR-3B, PMT-06, and GSTR-9 statutory return schedules.</p>
        </div>
      </div>

      {/* Upcoming Due Returns Banner */}
      <Card className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white">
        <div className="flex items-center space-x-2 text-indigo-300 mb-2">
          <Calendar className="w-4 h-4" />
          <h3 className="text-xs font-bold uppercase tracking-wider">Upcoming GST Deadlines (Next 30 Days)</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mt-3">
          {upcomingData?.slice(0, 3).map((item: any) => (
            <div key={item.id} className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700">
              <p className="font-bold text-white truncate">{item.clientName}</p>
              <p className="text-[10px] text-slate-400 font-mono">{item.returnType} • {item.period}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] font-bold text-amber-400">Due: {item.dueDate}</span>
                <StatusBadge status={item.status} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2 text-xs">
        <div className="flex space-x-2">
          {["", "due", "PENDING", "OVERDUE", "FILED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-smooth ${
                statusFilter === st ? "bg-rose-600 text-white shadow-xs" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {st === "due" ? "Due / Approaching" : st || "All Statuses"}
            </button>
          ))}
        </div>

        <div className="flex space-x-2">
          {["", "GSTR1", "GSTR3B", "GSTR9"].map((rt) => (
            <button
              key={rt}
              onClick={() => setReturnTypeFilter(rt)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-smooth ${
                returnTypeFilter === rt ? "bg-indigo-600 text-white shadow-xs" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
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
