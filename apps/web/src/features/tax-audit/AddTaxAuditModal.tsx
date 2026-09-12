import React, { useState } from "react";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { useGetClientsQuery, useCreateTaxAuditMutation } from "../../lib/api";
import { TaxAuditFormType } from "@ca-saas/shared-types";
import { ShieldCheck, AlertCircle } from "lucide-react";

interface AddTaxAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTaxAuditModal: React.FC<AddTaxAuditModalProps> = ({ isOpen, onClose }) => {
  const { data: clientsData } = useGetClientsQuery({ limit: 100 });
  const [createTaxAudit, { isLoading }] = useCreateTaxAuditMutation();

  const [clientId, setClientId] = useState("");
  const [assessmentYear, setAssessmentYear] = useState("AY 2026-27");
  const [formType, setFormType] = useState<TaxAuditFormType>("FORM_3CA_3CD");
  const [turnover, setTurnover] = useState("");
  const [cashTxnPercentage, setCashTxnPercentage] = useState("2.5");
  const [dueDate, setDueDate] = useState("2026-09-30");
  const [errorMsg, setErrorMsg] = useState("");

  const handleClientSelect = (selectedId: string) => {
    setClientId(selectedId);
    const client = clientsData?.data?.find((c: any) => c.id === selectedId);
    if (client) {
      if (client.entityType === "PVT_LTD" || client.entityType === "LLP") {
        setFormType("FORM_3CA_3CD");
      } else {
        setFormType("FORM_3CB_3CD");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!clientId) {
      setErrorMsg("Please select an active client for the audit engagement.");
      return;
    }

    const turnoverNum = parseFloat(turnover.replace(/,/g, ""));
    if (isNaN(turnoverNum) || turnoverNum <= 0) {
      setErrorMsg("Please enter a valid gross turnover / gross receipts amount.");
      return;
    }

    const cashPct = parseFloat(cashTxnPercentage);
    if (isNaN(cashPct) || cashPct < 0 || cashPct > 100) {
      setErrorMsg("Cash transaction percentage must be between 0% and 100%.");
      return;
    }

    try {
      await createTaxAudit({
        clientId,
        assessmentYear,
        formType,
        turnover: turnoverNum,
        cashTxnPercentage: cashPct,
        dueDate
      }).unwrap();

      onClose();
      // Reset form
      setClientId("");
      setTurnover("");
      setCashTxnPercentage("2.5");
    } catch (err: any) {
      setErrorMsg(err?.data?.error?.message || "Failed to create Tax Audit engagement.");
    }
  };

  const clientOptions = [
    { value: "", label: "-- Select Active Client --" },
    ...(clientsData?.data?.map((c: any) => ({
      value: c.id,
      label: `${c.name} (${c.pan}) [${c.entityType}]`
    })) || [])
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Initiate Section 44AB Tax Audit Engagement" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info Banner */}
        <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-xl text-xs text-purple-800 dark:text-purple-300 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Section 44AB Statutory Audit Engagement:</span>
            <p className="text-purple-700 dark:text-purple-400 text-[11px] mt-0.5">
              Applies to businesses with turnover exceeding ₹1 Cr (₹10 Cr if cash transactions ≤ 5%) and professionals with gross receipts &gt; ₹50 Lakhs. Form 3CA is applicable to corporate/LLP entities, and Form 3CB to proprietary/partnership entities.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-lg font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Select
              label="Select Client for Audit"
              value={clientId}
              onChange={(e) => handleClientSelect(e.target.value)}
              options={clientOptions}
            />
          </div>

          <Select
            label="Audit Form Type"
            value={formType}
            onChange={(e) => setFormType(e.target.value as any)}
            options={[
              { value: "FORM_3CA_3CD", label: "Form 3CA / 3CD (Corporate / LLP Audited under other laws)" },
              { value: "FORM_3CB_3CD", label: "Form 3CB / 3CD (Proprietorship / Partnership Direct Audit)" }
            ]}
          />

          <Select
            label="Assessment Year"
            value={assessmentYear}
            onChange={(e) => setAssessmentYear(e.target.value)}
            options={[
              { value: "AY 2026-27", label: "AY 2026-27 (FY 2025-26)" },
              { value: "AY 2025-26", label: "AY 2025-26 (FY 2024-25)" }
            ]}
          />

          <Input
            label="Gross Annual Turnover / Receipts (₹)"
            placeholder="e.g. 25,000,000"
            value={turnover}
            onChange={(e) => setTurnover(e.target.value)}
            required
          />

          <Input
            label="Cash Transaction % (Aggregate Receipts/Payments)"
            type="number"
            step="0.1"
            placeholder="e.g. 2.5"
            value={cashTxnPercentage}
            onChange={(e) => setCashTxnPercentage(e.target.value)}
            helperText="≤ 5% enables higher ₹10 Cr limit under Sec 44AB proviso"
            required
          />

          <div className="sm:col-span-2">
            <Input
              label="Statutory Audit Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              helperText="Default statutory audit report due date is 30th September of the Assessment Year"
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Create Audit Engagement
          </Button>
        </div>
      </form>
    </Modal>
  );
};
