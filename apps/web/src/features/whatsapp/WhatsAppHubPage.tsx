import React, { useState, useEffect } from "react";
import { MessageSquare, DollarSign, Send, CheckCircle2, ShieldAlert } from "lucide-react";
import {
  useGetWhatsAppMessagesQuery,
  useGetWhatsAppMonthlySpendQuery,
  useGetWhatsAppTemplatesQuery,
  useSendWhatsAppTemplateMutation,
  useGetClientsQuery
} from "../../lib/api";
import { Table, Column } from "../../components/ui/Table";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { WhatsAppMessageRecord } from "@ca-saas/shared-types";
import { PageHeader } from "../../components/ui/PageHeader";

export const WhatsAppHubPage: React.FC = () => {
  const { data: clientsData } = useGetClientsQuery({});
  const [clientId, setClientId] = useState("");
  const [templateName, setTemplateName] = useState("compliance_due_reminder");

  const { data: messagesData, isLoading } = useGetWhatsAppMessagesQuery({});
  const { data: spendData } = useGetWhatsAppMonthlySpendQuery({});
  const { data: templatesData } = useGetWhatsAppTemplatesQuery({});

  const [sendWhatsApp, { isLoading: isSending }] = useSendWhatsAppTemplateMutation();

  const clients = clientsData?.data || [];

  useEffect(() => {
    if (clients.length > 0 && !clientId) {
      setClientId(clients[0].id);
    }
  }, [clients, clientId]);

  const handleSendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      alert("Please select a client to send the WhatsApp reminder.");
      return;
    }
    const selectedClient = clients.find((c: any) => c.id === clientId);
    try {
      await sendWhatsApp({
        clientId,
        templateName,
        variables: {
          client_name: selectedClient?.name || "Valued Client",
          return_type: "Statutory Return",
          due_date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
        }
      }).unwrap();
      alert("WhatsApp message dispatched successfully!");
    } catch (err: any) {
      alert(err?.data?.error?.message || "Send failed");
    }
  };

  const columns: Column<WhatsAppMessageRecord>[] = [
    {
      header: "Client Name",
      cell: (row) => (
        <div>
          <p className="font-semibold text-foreground text-xs">{row.clientName}</p>
          <span className="text-[10px] text-muted-foreground">{new Date(row.sentAt).toLocaleString()}</span>
        </div>
      )
    },
    {
      header: "Direction",
      cell: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            row.direction === "INBOUND" ? "bg-primary-muted text-primary" : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
          }`}
        >
          {row.direction}
        </span>
      )
    },
    {
      header: "Message Body",
      cell: (row) => <p className="text-xs text-foreground max-w-xs truncate">{row.body}</p>
    },
    {
      header: "Statutory Cost",
      cell: (row) => <span className="font-mono text-xs font-semibold text-foreground/80">₹{row.cost.toFixed(2)}</span>
    },
    {
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp Hub"
        description="WhatsApp Business API for compliance reminders and document collection."
      />

      {/* Spend Tracker KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-300 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Monthly WhatsApp Spend</span>
          </div>
          <p className="text-2xl font-bold text-foreground">₹{spendData?.totalSpend ? spendData.totalSpend.toFixed(2) : "0.00"}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{spendData?.month || "Current"} Billing Cycle</p>
        </Card>

        <Card>
          <span className="text-xs font-semibold text-muted-foreground">Outbound Messages Sent</span>
          <p className="text-2xl font-bold text-foreground mt-2">{spendData?.totalSent || 0}</p>
        </Card>

        <Card>
          <span className="text-xs font-semibold text-muted-foreground">Approved Templates</span>
          <p className="text-2xl font-bold text-primary mt-2">{templatesData?.length || 2}</p>
        </Card>
      </div>

      {/* Quick Dispatch Section */}
      <Card>
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Quick Dispatch WhatsApp Reminder</h3>
        {clients.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            No clients registered yet. Please add a client before dispatching WhatsApp reminders.
          </p>
        ) : (
          <form onSubmit={handleSendSubmit} className="flex flex-wrap items-center gap-3">
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="text-xs border border-border rounded-lg px-3 py-2 bg-card text-foreground font-medium"
            >
              {clients.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.contactPhone})
                </option>
              ))}
            </select>

            <select
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="text-xs border border-border rounded-lg px-3 py-2 bg-card text-foreground font-medium"
            >
              {templatesData?.map((t: any) => (
                <option key={t.id} value={t.name}>
                  {t.name.replace(/_/g, " ").toUpperCase()} ({t.category})
                </option>
              )) || (
                <>
                  <option value="compliance_due_reminder">COMPLIANCE DUE REMINDER</option>
                  <option value="document_request">DOCUMENT REQUEST</option>
                </>
              )}
            </select>

            <Button type="submit" size="sm" isLoading={isSending} leftIcon={<Send className="w-3.5 h-3.5" />}>
              Dispatch WhatsApp
            </Button>
          </form>
        )}
      </Card>

      {/* Table */}
      <Table columns={columns} data={messagesData?.data || []} isLoading={isLoading} emptyText="No WhatsApp logs dispatched." />
    </div>
  );
};
