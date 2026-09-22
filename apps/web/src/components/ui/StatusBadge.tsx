import React from "react";
import { cn } from "../../lib/cn";

export type StatusVariant =
  | "ACTIVE"
  | "INACTIVE"
  | "ONBOARDING"
  | "LEAD"
  | "NOT_STARTED"
  | "DOCUMENTS_PENDING"
  | "UNDER_PREPARATION"
  | "FILED"
  | "VERIFIED"
  | "PROCESSED"
  | "REFUND_ISSUED"
  | "PENDING"
  | "OVERDUE"
  | "PAID"
  | "DRAFT"
  | "SENT"
  | "TODO"
  | "IN_PROGRESS"
  | "DONE"
  | "MATCHED"
  | "MISMATCH_UNDER"
  | "MISMATCH_OVER"
  | "UNRECONCILED"
  | "HIGH"
  | "URGENT"
  | "MEDIUM"
  | "LOW";

export interface StatusBadgeProps {
  status: StatusVariant | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const getBadgeStyle = (s: string) => {
    switch (s) {
      case "ACTIVE":
      case "FILED":
      case "VERIFIED":
      case "PROCESSED":
      case "REFUND_ISSUED":
      case "PAID":
      case "DONE":
      case "MATCHED":
      case "CLIENT_ACCEPTED":
      case "APPROVED_ISSUED":
        return "bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60";
      case "UNDER_PREPARATION":
      case "IN_PROGRESS":
      case "SENT":
      case "ONBOARDING":
      case "PENDING":
      case "BOOKS_AUDIT":
      case "ARN_SUBMITTED":
      case "AADHAAR_AUTH":
        return "bg-primary-muted text-teal-800 border-teal-200/80 dark:text-teal-200 dark:border-teal-800/60";
      case "LEAD":
      case "FORM_3CD_PREP":
      case "UDIN_GENERATED":
      case "PORTAL_FILED":
        return "bg-sky-50 text-sky-800 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60";
      case "DOCUMENTS_PENDING":
      case "MISMATCH_UNDER":
      case "MISMATCH_OVER":
      case "MEDIUM":
      case "HIGH":
      case "ENGAGEMENT":
      case "TRN_GENERATED":
        return "bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60";
      case "OVERDUE":
      case "URGENT":
      case "REJECTED":
      case "UNRECONCILED":
      case "CLARIFICATION_PENDING":
        return "bg-rose-50 text-rose-800 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-2xs font-semibold border capitalize tracking-wide",
        getBadgeStyle(status),
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {status.replace(/_/g, " ")}
    </span>
  );
};
