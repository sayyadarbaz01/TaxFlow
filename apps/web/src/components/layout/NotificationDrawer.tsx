import React from "react";
import { Drawer } from "../ui/Drawer";
import { AlertCircle, Clock, CheckCircle2, FileText, CreditCard } from "lucide-react";
import { useGetGstReturnsQuery, useGetTasksQuery, useGetInvoicesQuery } from "../../lib/api";

export interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { data: gstData } = useGetGstReturnsQuery({});
  const { data: tasksData } = useGetTasksQuery({});
  const { data: invoicesData } = useGetInvoicesQuery({});

  const notifications: Array<{
    id: string;
    title: string;
    message: string;
    time: string;
    icon: any;
    color: string;
  }> = [];

  // 1. Pending / Overdue GST returns
  if (gstData?.data) {
    gstData.data
      .filter((g: any) => g.status !== "FILED")
      .slice(0, 3)
      .forEach((g: any) => {
        notifications.push({
          id: `gst-${g.id}`,
          title: `GST Return Pending: ${g.returnType}`,
          message: `${g.clientName} return is due on ${g.dueDate}.`,
          time: "Statutory Deadline",
          icon: Clock,
          color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50"
        });
      });
  }

  // 2. High priority tasks
  if (tasksData?.data) {
    tasksData.data
      .filter((t: any) => t.status !== "COMPLETED")
      .slice(0, 3)
      .forEach((t: any) => {
        notifications.push({
          id: `task-${t.id}`,
          title: `Active Task: ${t.title}`,
          message: `${t.clientName} • Due ${t.dueDate}`,
          time: t.priority,
          icon: FileText,
          color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50"
        });
      });
  }

  // 3. Overdue invoices
  if (invoicesData?.data) {
    invoicesData.data
      .filter((i: any) => i.status === "OVERDUE")
      .slice(0, 3)
      .forEach((i: any) => {
        notifications.push({
          id: `inv-${i.id}`,
          title: `Invoice Overdue: ${i.invoiceNo}`,
          message: `${i.clientName} (₹${i.total.toLocaleString("en-IN")}) overdue since ${i.dueDate}`,
          time: "Overdue",
          icon: CreditCard,
          color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50"
        });
      });
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Activity Notifications">
      {notifications.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">Zero Pending Notifications</h4>
            <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto">
              All firm filings, client requests, and invoices are up to date.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const Icon = n.icon;
            return (
              <div
                key={n.id}
                className="p-3 rounded-lg border border-border bg-card shadow-2xs hover:border-border transition-smooth flex items-start space-x-3"
              >
                <div className={`p-2 rounded-lg mt-0.5 ${n.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground">{n.title}</h4>
                    <span className="text-[10px] text-muted-foreground font-semibold">{n.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Drawer>
  );
};

