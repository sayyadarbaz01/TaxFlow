import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { CreditCard, Plus, QrCode, CheckCircle2, MessageSquare, ExternalLink } from "lucide-react";
import { useGetInvoicesQuery, useCreateInvoiceMutation, useMarkInvoicePaidMutation, useSendWhatsAppTemplateMutation } from "../../lib/api";
import { Table, Column } from "../../components/ui/Table";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { InvoiceRecord } from "@ca-saas/shared-types";

export const BillingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [selectedUpiInvoice, setSelectedUpiInvoice] = useState<InvoiceRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");

  useEffect(() => {
    const s = searchParams.get("status");
    if (s !== null) {
      setStatusFilter(s);
    }
  }, [searchParams]);

  // New Invoice State
  const [clientId, setClientId] = useState("a1b2c3d4-e5f6-7890-abcd-ef1234567890");
  const [desc, setDesc] = useState("Professional Services - ITR Preparation & GST Compliance");
  const [amount, setAmount] = useState("15000");
  const [dueDate, setDueDate] = useState("2026-09-30");

  const { data, isLoading } = useGetInvoicesQuery({ status: statusFilter || undefined });
  const [createInvoice, { isLoading: isCreating }] = useCreateInvoiceMutation();
  const [markInvoicePaid, { isLoading: isMarking }] = useMarkInvoicePaidMutation();
  const [sendWhatsApp] = useSendWhatsAppTemplateMutation();

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createInvoice({
        clientId,
        lineItems: [{ description: desc, amount: Number(amount) }],
        dueDate,
        taxRatePercentage: 18
      }).unwrap();
      setIsCreateOpen(false);
    } catch (err: any) {
      alert(err.data?.error?.message || "Failed to create invoice");
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await markInvoicePaid({ id, method: "UPI" }).unwrap();
    } catch (err: any) {
      alert(err.data?.error?.message || "Failed to mark invoice paid");
    }
  };

  const handleSendReminder = async (invoiceNo: string, total: number, clientId: string) => {
    try {
      await sendWhatsApp({
        clientId,
        templateName: "compliance_due_reminder",
        variables: { client_name: "Client", return_type: `Invoice ${invoiceNo} (₹${total})`, due_date: "Immediate" }
      }).unwrap();
      alert(`WhatsApp payment reminder sent for ${invoiceNo}!`);
    } catch (err: any) {
      alert("Failed to send WhatsApp reminder");
    }
  };

  const columns: Column<InvoiceRecord>[] = [
    {
      header: "Invoice #",
      cell: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-foreground">{row.invoiceNo}</span>
          <p className="text-[10px] text-muted-foreground">{row.clientName}</p>
        </div>
      )
    },
    {
      header: "Subtotal",
      cell: (row) => <span className="font-mono text-xs text-foreground/80">₹{row.subtotal.toLocaleString("en-IN")}</span>
    },
    {
      header: "GST (18%)",
      cell: (row) => <span className="font-mono text-xs text-muted-foreground">₹{row.tax.toLocaleString("en-IN")}</span>
    },
    {
      header: "Total Fee",
      cell: (row) => <span className="font-mono text-xs font-bold text-foreground">₹{row.total.toLocaleString("en-IN")}</span>
    },
    {
      header: "Due Date",
      cell: (row) => <span className="font-mono text-xs text-foreground/80">{row.dueDate}</span>
    },
    {
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<QrCode className="w-3.5 h-3.5 text-primary" />}
            onClick={() => setSelectedUpiInvoice(row)}
          >
            UPI QR
          </Button>

          {row.status !== "PAID" ? (
            <>
              <Button
                size="sm"
                isLoading={isMarking}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                onClick={() => handleMarkPaid(row.id)}
              >
                Mark Paid
              </Button>
              <Button
                size="sm"
                variant="ghost"
                leftIcon={<MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                onClick={() => handleSendReminder(row.invoiceNo, row.total, row.clientId)}
              >
                Reminder
              </Button>
            </>
          ) : (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">✓ Settled</span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Invoices"
        description="Invoice creation, automated GST, UPI collection, and payment tracking."
        actions={
          <Button onClick={() => setIsCreateOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Create Invoice
          </Button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-border pb-2 text-xs overflow-x-auto">
        {[
          { id: "", label: "All Invoices" },
          { id: "unpaid", label: "Unpaid / Overdue" },
          { id: "SENT", label: "Sent" },
          { id: "OVERDUE", label: "Overdue" },
          { id: "PAID", label: "Paid" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-smooth ${
              statusFilter === tab.id
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-card border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Table columns={columns} data={data?.data || []} isLoading={isLoading} emptyText="No invoices generated." />

      {/* UPI QR Modal */}
      {selectedUpiInvoice && (
        <Modal isOpen={!!selectedUpiInvoice} onClose={() => setSelectedUpiInvoice(null)} title={`UPI Collection — ${selectedUpiInvoice.invoiceNo}`}>
          <div className="text-center space-y-4 py-2">
            <div className="bg-muted p-6 rounded-2xl border border-border inline-block">
              <QrCode className="w-40 h-40 text-foreground mx-auto" />
              <p className="font-mono text-xs font-bold text-foreground mt-3">{selectedUpiInvoice.upiLink}</p>
            </div>
            <div>
              <h4 className="text-base font-bold text-foreground">Total Payable: ₹{selectedUpiInvoice.total.toLocaleString("en-IN")}</h4>
              <p className="text-xs text-muted-foreground mt-1">Scan using BHIM, Google Pay, PhonePe, or Paytm</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Invoice Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Fee Invoice">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input label="Description of Professional Service" value={desc} onChange={(e) => setDesc(e.target.value)} required />
          <Input label="Subtotal Amount (₹)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <Input label="Invoice Due Date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          <div className="p-3 bg-primary-muted text-blue-800 dark:text-blue-300 border border-primary/20 rounded-lg text-xs font-medium">
            18% GST (₹{Math.round(Number(amount || 0) * 0.18)}) will be auto-calculated. Total: ₹{Math.round(Number(amount || 0) * 1.18)}.
          </div>
          <Button type="submit" className="w-full" isLoading={isCreating}>
            Generate Invoice & UPI Link
          </Button>
        </form>
      </Modal>
    </div>
  );
};
