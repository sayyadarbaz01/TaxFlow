import React from "react";
import { clsx } from "clsx";

export type StatusVariant =
  | "ACTIVE" | "INACTIVE" | "ONBOARDING" | "LEAD"
  | "NOT_STARTED" | "DOCUMENTS_PENDING" | "UNDER_PREPARATION" | "FILED" | "VERIFIED" | "PROCESSED" | "REFUND_ISSUED"
  | "PENDING" | "OVERDUE" | "PAID" | "DRAFT" | "SENT"
  | "TODO" | "IN_PROGRESS" | "DONE"
  | "MATCHED" | "MISMATCH_UNDER" | "MISMATCH_OVER" | "UNRECONCILED"
  | "HIGH" | "URGENT" | "MEDIUM" | "LOW";

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
        return "bg-emerald-50 text-emerald-700 border-emerald-200 icon-emerald";
      case "UNDER_PREPARATION":
      case "IN_PROGRESS":
      case "SENT":
      case "ONBOARDING":
      case "PENDING":
      case "BOOKS_AUDIT":
      case "ARN_SUBMITTED":
      case "AADHAAR_AUTH":
        return "bg-blue-50 text-blue-700 border-blue-200 icon-blue";
      case "LEAD":
      case "FORM_3CD_PREP":
      case "UDIN_GENERATED":
      case "PORTAL_FILED":
        return "bg-purple-50 text-purple-700 border-purple-200 icon-purple";
      case "DOCUMENTS_PENDING":
      case "MISMATCH_UNDER":
      case "MISMATCH_OVER":
      case "MEDIUM":
      case "HIGH":
      case "ENGAGEMENT":
      case "TRN_GENERATED":
        return "bg-amber-50 text-amber-700 border-amber-200 icon-amber";
      case "OVERDUE":
      case "URGENT":
      case "REJECTED":
      case "UNRECONCILED":
      case "CLARIFICATION_PENDING":
        return "bg-rose-50 text-rose-700 border-rose-200 icon-rose";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 icon-slate";
    }
  };

  const getLabel = (s: string) => {
    return s.replace(/_/g, " ");
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize tracking-wide",
        getBadgeStyle(status),
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"></span>
      {getLabel(status)}
    </span>
  );
};
