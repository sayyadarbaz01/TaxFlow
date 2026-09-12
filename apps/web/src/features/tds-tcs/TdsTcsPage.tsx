import React from "react";
import { Layers, AlertCircle, CheckCircle2, TrendingDown } from "lucide-react";
import { useGetTdsEntriesQuery } from "../../lib/api";
import { Table, Column } from "../../components/ui/Table";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Card } from "../../components/ui/Card";
import { TdsTcsEntryRecord } from "@ca-saas/shared-types";

export const TdsTcsPage: React.FC = () => {
  const { data, isLoading } = useGetTdsEntriesQuery({});

  const totalExpected = data?.data.reduce((acc: number, item: any) => acc + item.expectedAmount, 0) || 0;
  const totalCredited = data?.data.reduce((acc: number, item: any) => acc + item.creditedAmount, 0) || 0;
  const totalMismatch = Math.abs(totalExpected - totalCredited);

  const columns: Column<TdsTcsEntryRecord>[] = [
    {
      header: "Client Name",
      cell: (row) => (
        <div>
          <p className="font-semibold text-slate-900 text-xs">{row.clientName}</p>
          <span className="text-[10px] text-slate-500">{row.financialYear}</span>
        </div>
      )
    },
    {
      header: "Deductor TAN",
      cell: (row) => <span className="font-mono text-xs font-semibold text-slate-800">{row.deductorTan}</span>
    },
    {
      header: "Type",
      cell: (row) => <span className="font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{row.entryType}</span>
    },
    {
      header: "Expected",
      cell: (row) => <span className="font-mono text-xs font-medium text-slate-700">₹{row.expectedAmount.toLocaleString("en-IN")}</span>
    },
    {
      header: "Credited (26AS)",
      cell: (row) => <span className="font-mono text-xs font-medium text-slate-900">₹{row.creditedAmount.toLocaleString("en-IN")}</span>
    },
    {
      header: "Mismatch Amount",
      cell: (row) => (
        <span className={`font-mono text-xs font-bold ${row.mismatchAmount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
          ₹{row.mismatchAmount.toLocaleString("en-IN")}
        </span>
      )
    },
    {
      header: "Reconciliation Status",
      cell: (row) => <StatusBadge status={row.reconciliationStatus} />
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">TDS / TCS 26AS & AIS Reconciliation</h1>
          <p className="text-xs text-slate-500 mt-1">Financial reconciliation matching expected TDS deductions against Form 26AS tax credits.</p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white">
          <span className="text-xs font-semibold text-slate-500">Total Expected TDS</span>
          <p className="text-2xl font-bold text-slate-900 mt-2">₹{totalExpected.toLocaleString("en-IN")}</p>
        </Card>

        <Card className="bg-white">
          <span className="text-xs font-semibold text-slate-500">Total Credited in 26AS</span>
          <p className="text-2xl font-bold text-emerald-600 mt-2">₹{totalCredited.toLocaleString("en-IN")}</p>
        </Card>

        <Card className="bg-white border-rose-200">
          <span className="text-xs font-semibold text-slate-500">Total Under-credit Mismatch</span>
          <p className="text-2xl font-bold text-rose-600 mt-2">₹{totalMismatch.toLocaleString("en-IN")}</p>
        </Card>
      </div>

      {/* Reconciliation Table */}
      <Table columns={columns} data={data?.data || []} isLoading={isLoading} emptyText="No TDS/TCS reconciliation records found." />
    </div>
  );
};
