import React, { useState } from "react";
import { FileSpreadsheet, ChevronDown, ChevronRight, User } from "lucide-react";
import { useGetAuditLogsQuery } from "../../lib/api";
import { Table, Column } from "../../components/ui/Table";
import { AuditLogRecord } from "@ca-saas/shared-types";
import { PageHeader } from "../../components/ui/PageHeader";

export const AuditLogsPage: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data, isLoading } = useGetAuditLogsQuery({});

  const columns: Column<AuditLogRecord>[] = [
    {
      header: "Timestamp",
      cell: (row) => <span className="font-mono text-[11px] text-muted-foreground">{new Date(row.createdAt).toLocaleString()}</span>
    },
    {
      header: "User / Actor",
      cell: (row) => (
        <span className="text-xs font-semibold text-foreground">{row.userName}</span>
      )
    },
    {
      header: "Action Triggered",
      cell: (row) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-muted text-primary border border-primary/20">
          {row.action}
        </span>
      )
    },
    {
      header: "Entity Affected",
      cell: (row) => <span className="text-xs font-medium text-foreground/80">{row.entityType} ({row.entityId.substring(0, 8)}...)</span>
    },
    {
      header: "Payload Diff",
      cell: (row) => (
        <button
          onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
          className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
        >
          {expandedId === row.id ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          View JSON Diff
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Immutable log of client creation, status transitions, uploads, and billing changes."
      />

      <Table columns={columns} data={data?.data || []} isLoading={isLoading} emptyText="No audit log entries recorded." />

      {expandedId && (
        <div className="bg-slate-900 dark:bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto space-y-2 border border-slate-800">
          <p className="font-bold text-primary">JSON State Diff for Log Item #{expandedId}:</p>
          <pre>{JSON.stringify(data?.data.find((l: any) => l.id === expandedId), null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
