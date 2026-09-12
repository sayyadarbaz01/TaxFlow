import React, { useState } from "react";
import { FileSpreadsheet, ChevronDown, ChevronRight, User } from "lucide-react";
import { useGetAuditLogsQuery } from "../../lib/api";
import { Table, Column } from "../../components/ui/Table";
import { AuditLogRecord } from "@ca-saas/shared-types";

export const AuditLogsPage: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data, isLoading } = useGetAuditLogsQuery({});

  const columns: Column<AuditLogRecord>[] = [
    {
      header: "Timestamp",
      cell: (row) => <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">{new Date(row.createdAt).toLocaleString()}</span>
    },
    {
      header: "User / Actor",
      cell: (row) => (
        <span className="text-xs font-semibold text-slate-900 dark:text-white">{row.userName}</span>
      )
    },
    {
      header: "Action Triggered",
      cell: (row) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
          {row.action}
        </span>
      )
    },
    {
      header: "Entity Affected",
      cell: (row) => <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{row.entityType} ({row.entityId.substring(0, 8)}...)</span>
    },
    {
      header: "Payload Diff",
      cell: (row) => (
        <button
          onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
        >
          {expandedId === row.id ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          View JSON Diff
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Practice Audit Log Stream</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Immutable security log recording all client creation, status transitions, uploads, and billing modifications.</p>
      </div>

      <Table columns={columns} data={data?.data || []} isLoading={isLoading} emptyText="No audit log entries recorded." />

      {expandedId && (
        <div className="bg-slate-900 dark:bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto space-y-2 border border-slate-800">
          <p className="font-bold text-blue-400">JSON State Diff for Log Item #{expandedId}:</p>
          <pre>{JSON.stringify(data?.data.find((l: any) => l.id === expandedId), null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
