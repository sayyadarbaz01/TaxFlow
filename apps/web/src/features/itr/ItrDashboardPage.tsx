import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FileText, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { useGetItrFilingsQuery, useUpdateItrStatusMutation } from "../../lib/api";
import { Table, Column } from "../../components/ui/Table";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Stepper } from "../../components/ui/Stepper";
import { ItrFilingRecord, ItrStatus } from "@ca-saas/shared-types";

export const ItrDashboardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [selectedStatus, setSelectedStatus] = useState<string>(searchParams.get("status") || "");
  const [selectedFiling, setSelectedFiling] = useState<ItrFilingRecord | null>(null);

  useEffect(() => {
    const s = searchParams.get("status");
    if (s !== null) {
      setSelectedStatus(s);
    }
  }, [searchParams]);

  const { data, isLoading } = useGetItrFilingsQuery({ status: selectedStatus || undefined });
  const [updateItrStatus, { isLoading: isUpdating }] = useUpdateItrStatusMutation();

  const steps = [
    { id: "NOT_STARTED", label: "Not Started" },
    { id: "DOCUMENTS_PENDING", label: "Docs Pending" },
    { id: "UNDER_PREPARATION", label: "Preparation" },
    { id: "FILED", label: "Filed" },
    { id: "VERIFIED", label: "Verified" },
    { id: "PROCESSED", label: "Processed" },
    { id: "REFUND_ISSUED", label: "Refund Issued" }
  ];

  const handleNextState = async (filing: ItrFilingRecord) => {
    let nextState: ItrStatus = "UNDER_PREPARATION";
    if (filing.status === "NOT_STARTED") nextState = "DOCUMENTS_PENDING";
    else if (filing.status === "DOCUMENTS_PENDING") nextState = "UNDER_PREPARATION";
    else if (filing.status === "UNDER_PREPARATION") nextState = "FILED";
    else if (filing.status === "FILED") nextState = "VERIFIED";
    else if (filing.status === "VERIFIED") nextState = "PROCESSED";
    else if (filing.status === "PROCESSED") nextState = "REFUND_ISSUED";

    try {
      await updateItrStatus({ id: filing.id, status: nextState }).unwrap();
    } catch (err: any) {
      alert(err.data?.error?.message || "Status update failed");
    }
  };

  const columns: Column<ItrFilingRecord>[] = [
    {
      header: "Client Name",
      cell: (row) => (
        <div>
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-slate-900 dark:text-white text-xs">{row.clientName}</p>
            {row.workType === "ITR + GST" && (
              <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                ITR + GST
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">{row.assessmentYear}</span>
        </div>
      )
    },
    {
      header: "ITR Form",
      cell: (row) => <span className="font-bold text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">{row.itrFormType}</span>
    },
    {
      header: "Statutory Due Date",
      cell: (row) => <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{row.dueDate}</span>
    },
    {
      header: "Status Stepper",
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: "Assigned Staff",
      cell: (row) => <span className="text-xs text-slate-700 dark:text-slate-300">{row.assignedStaffName || "Unassigned"}</span>
    },
    {
      header: "Workflow Action",
      cell: (row) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedFiling(row)}
          >
            Inspect Stepper
          </Button>
          {row.status !== "REFUND_ISSUED" && (
            <Button
              size="sm"
              isLoading={isUpdating}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={() => handleNextState(row)}
            >
              Advance State
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">ITR Compliance Automation Engine</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Data-driven ITR preparation, status stepper tracking, and verification.</p>
        </div>
      </div>

      {/* Selected Filing Stepper Drawer/Section */}
      {selectedFiling && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between pb-2 border-b border-blue-100 dark:border-blue-900">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{selectedFiling.clientName} — {selectedFiling.assessmentYear} ({selectedFiling.itrFormType})</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Statutory Due Date: {selectedFiling.dueDate}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setSelectedFiling(null)}>Close</Button>
          </div>
          <Stepper steps={steps} currentStepId={selectedFiling.status} />
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
        {["", "pending", "NOT_STARTED", "DOCUMENTS_PENDING", "UNDER_PREPARATION", "FILED", "VERIFIED", "PROCESSED", "REFUND_ISSUED"].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-smooth ${
              selectedStatus === st
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {st === "pending" ? "Pending Actions" : st ? st.replace(/_/g, " ") : "All Filings"}
          </button>
        ))}
      </div>

      {/* Table */}
      <Table columns={columns} data={data?.data || []} isLoading={isLoading} emptyText="No ITR filings found." />
    </div>
  );
};
