import React from "react";
import { cn } from "../../lib/cn";

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

function TableInner<T>({
  columns,
  data,
  isLoading = false,
  emptyText = "No records found"
}: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-card shadow-2xs">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-muted/60 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-2xs">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className={cn("px-4 py-3 whitespace-nowrap", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-foreground">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, rIdx) => (
              <tr key={rIdx} className="animate-pulse">
                {columns.map((_, cIdx) => (
                  <td key={cIdx} className="px-4 py-3.5">
                    <div className="h-3.5 bg-muted rounded w-3/4" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-muted-foreground font-medium"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, rIdx) => (
              <tr
                key={(row as any)?.id || rIdx}
                className="hover:bg-muted/40 transition-colors duration-150"
              >
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className={cn("px-4 py-3.5", col.className)}>
                    {col.cell
                      ? col.cell(row)
                      : col.accessorKey
                        ? String(row[col.accessorKey] ?? "")
                        : null}
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
