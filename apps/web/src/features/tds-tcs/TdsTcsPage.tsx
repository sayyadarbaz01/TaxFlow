import React from "react";
import { Layers, AlertCircle, CheckCircle2, TrendingDown } from "lucide-react";
import { useGetTdsEntriesQuery } from "../../lib/api";
import { Table, Column } from "../../components/ui/Table";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Card } from "../../components/ui/Card";
import { TdsTcsEntryRecord } from "@ca-saas/shared-types";
import { PageHeader } from "../../components/ui/PageHeader";

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
          <p className="font-semibold text-foreground text-xs">{row.clientName}</p>
          <span className="text-[10px] text-muted-foreground">{row.financialYear}</span>
        </div>
      )
    },
    {
      header: "Deductor TAN",
      cell: (row) => <span className="font-mono text-xs font-semibold text-foreground">{row.deductorTan}</span>
    },
    {
      header: "Type",
      cell: (row) => <span className="font-bold text-xs text-primary bg-primary-muted px-2 py-0.5 rounded">{row.entryType}</span>
    },
    {
      header: "Expected",
      cell: (row) => <span className="font-mono text-xs font-medium text-foreground/80">₹{row.expectedAmount.toLocaleString("en-IN")}</span>
    },
    {
      header: "Credited (26AS)",
      cell: (row) => <span className="font-mono text-xs font-medium text-foreground">₹{row.creditedAmount.toLocaleString("en-IN")}</span>
    },
    {
      header: "Mismatch Amount",
      cell: (row) => (
        <span className={`font-mono text-xs font-bold ${row.mismatchAmount > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
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
      <PageHeader
        title="TDS / TCS"
        description="Reconcile expected TDS deductions against Form 26AS tax credits."
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border border-border">
          <span className="text-xs font-semibold text-muted-foreground">Total Expected TDS</span>
          <p className="text-2xl font-bold text-foreground mt-2">₹{totalExpected.toLocaleString("en-IN")}</p>
        </Card>

        <Card className="bg-card border border-border">
          <span className="text-xs font-semibold text-muted-foreground">Total Credited in 26AS</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">₹{totalCredited.toLocaleString("en-IN")}</p>
        </Card>

        <Card className="bg-card border-rose-200 dark:border-rose-800/60">
          <span className="text-xs font-semibold text-muted-foreground">Total Under-credit Mismatch</span>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">₹{totalMismatch.toLocaleString("en-IN")}</p>
        </Card>
      </div>

      {/* Reconciliation Table */}
      <Table columns={columns} data={data?.data || []} isLoading={isLoading} emptyText="No TDS/TCS reconciliation records found." />
    </div>
  );
};
