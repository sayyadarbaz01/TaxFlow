import React from "react";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyText?: string;
}

function TableInner<T>({ columns, data, isLoading = false, emptyText = "No records found" }: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs transition-colors">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className={`px-4 py-3 ${col.className || ""}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, rIdx) => (
              <tr key={rIdx} className="animate-pulse">
                {columns.map((_, cIdx) => (
                  <td key={cIdx} className="px-4 py-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 font-medium">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, rIdx) => (
              <tr key={(row as any)?.id || rIdx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-smooth">
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className={`px-4 py-3 ${col.className || ""}`}>
                    {col.cell ? col.cell(row) : col.accessorKey ? String(row[col.accessorKey] ?? "") : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export const Table = React.memo(TableInner) as typeof TableInner;

