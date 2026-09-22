import React, { useState } from "react";
import {
  ShieldCheck,
  ClipboardCheck,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Plus,
  ArrowRight,
  Search,
  FileText,
  Key,
  Clock
} from "lucide-react";
import {
  useGetTaxAuditsQuery,
  useGetTaxAuditSummaryQuery,
  useUpdateTaxAuditStageMutation,
  useGetTaxAuditClausesQuery,
  useUpdateTaxAuditClauseMutation
} from "../../lib/api";
import { Table, Column } from "../../components/ui/Table";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Stepper, Step } from "../../components/ui/Stepper";
import { AddTaxAuditModal } from "./AddTaxAuditModal";
import { TaxAuditRecord, TaxAuditStage } from "@ca-saas/shared-types";

export const TaxAuditPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [formTypeFilter, setFormTypeFilter] = useState("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<TaxAuditRecord | null>(null);

  // Clause modal state
  const [clauseModalAudit, setClauseModalAudit] = useState<TaxAuditRecord | null>(null);

  // Advance Stage modal state
  const [advanceModalAudit, setAdvanceModalAudit] = useState<TaxAuditRecord | null>(null);
  const [targetStage, setTargetStage] = useState<TaxAuditStage>("BOOKS_AUDIT");
  const [udinInput, setUdinInput] = useState("");
  const [ackInput, setAckInput] = useState("");
  const [advanceError, setAdvanceError] = useState("");

  const { data: summaryData } = useGetTaxAuditSummaryQuery();
  const { data: auditsData, isLoading } = useGetTaxAuditsQuery({
    search: search || undefined,
    stage: stageFilter !== "ALL" ? stageFilter : undefined,
    formType: formTypeFilter !== "ALL" ? formTypeFilter : undefined
  });

  const [updateStage, { isLoading: isUpdatingStage }] = useUpdateTaxAuditStageMutation();
  const { data: clausesData } = useGetTaxAuditClausesQuery(clauseModalAudit?.id || "", {
    skip: !clauseModalAudit
  });
  const [updateClause] = useUpdateTaxAuditClauseMutation();

  const summary = summaryData?.data || {
    totalEngagements: 0,
    form3CA3CDCount: 0,
    form3CB3CDCount: 0,
    pendingUdinCount: 0,
    completedCount: 0,
    auditDueDate: "2026-09-30",
    itrAuditDueDate: "2026-10-31"
  };

  const auditSteps: Step[] = [
    { id: "ENGAGEMENT", label: "Engagement", description: "Appointment & KYC" },
    { id: "BOOKS_AUDIT", label: "Books Audit", description: "Ledger & Vouchers" },
    { id: "FORM_3CD_PREP", label: "Form 3CD", description: "Clauses 1 to 44" },
    { id: "UDIN_GENERATED", label: "UDIN Sign-off", description: "Partner Certificate" },
    { id: "PORTAL_FILED", label: "Portal Upload", description: "CA e-Filing" },
    { id: "CLIENT_ACCEPTED", label: "Client Accepted", description: "IT Portal Acceptance" }
  ];

  const getNextStage = (current: TaxAuditStage): TaxAuditStage | null => {
    const sequence: TaxAuditStage[] = [
      "ENGAGEMENT",
      "BOOKS_AUDIT",
      "FORM_3CD_PREP",
      "UDIN_GENERATED",
      "PORTAL_FILED",
      "CLIENT_ACCEPTED"
    ];
    const idx = sequence.indexOf(current);
    return idx >= 0 && idx < sequence.length - 1 ? sequence[idx + 1] : null;
  };

  const handleOpenAdvanceModal = (audit: TaxAuditRecord) => {
    const next = getNextStage(audit.stage);
    if (!next) return;
    setAdvanceModalAudit(audit);
    setTargetStage(next);
    setUdinInput(audit.udin || "");
    setAckInput(audit.acknowledgementNo || "");
    setAdvanceError("");
  };

  const handleConfirmAdvance = async () => {
    if (!advanceModalAudit) return;
    setAdvanceError("");

    if (targetStage === "UDIN_GENERATED" && !udinInput.trim()) {
      setAdvanceError("Please enter the 18-character ICAI UDIN number.");
      return;
    }

    try {
      await updateStage({
        id: advanceModalAudit.id,
        stage: targetStage,
        udin: udinInput.trim() || undefined,
        acknowledgementNo: ackInput.trim() || undefined
      }).unwrap();

      setAdvanceModalAudit(null);
      if (selectedAudit?.id === advanceModalAudit.id) {
        setSelectedAudit((prev) => (prev ? { ...prev, stage: targetStage, udin: udinInput.trim() || prev.udin } : null));
      }
    } catch (err: any) {
      setAdvanceError(err?.data?.error?.message || "Failed to advance audit stage.");
    }
  };

  const handleClauseStatusToggle = async (clauseNumber: number, currentStatus: string) => {
    if (!clauseModalAudit) return;
    const nextStatus = currentStatus === "VERIFIED" ? "FLAGGED" : "VERIFIED";
    try {
      await updateClause({
        id: clauseModalAudit.id,
        clauseNumber,
        status: nextStatus
      }).unwrap();
    } catch (err) {
      console.error("Failed to update clause status:", err);
    }
  };

  const columns: Column<TaxAuditRecord>[] = [
    {
      header: "Client & Entity",
      cell: (row) => (
        <div>
          <p className="font-bold text-foreground text-xs">{row.clientName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="font-mono text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-medium">
              {row.pan}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">({row.entityType})</span>
          </div>
        </div>
      )
    },
    {
      header: "Audit Form",
      cell: (row) => (
        <div>
          <span
            className={`font-semibold text-xs px-2 py-0.5 rounded-full ${
              row.formType === "FORM_3CA_3CD"
                ? "bg-primary-muted dark:bg-primary-muted/50 text-primary dark:text-primary border border-primary/20"
                : "bg-primary-muted dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-primary/20"
            }`}
          >
            {row.formType === "FORM_3CA_3CD" ? "Form 3CA-3CD" : "Form 3CB-3CD"}
          </span>
          <p className="text-[10px] text-muted-foreground mt-0.5">{row.assessmentYear}</p>
        </div>
      )
    },
    {
      header: "Turnover & Cash %",
      cell: (row) => (
        <div>
          <p className="font-mono text-xs font-semibold text-foreground">
            ₹{(row.turnover / 10000000).toFixed(2)} Cr
          </p>
          <span
            className={`text-[10px] font-medium px-1.5 py-0.2 rounded inline-block mt-0.5 ${
              row.isCashLimitCompliant ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50" : "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 font-bold"
            }`}
          >
            Cash: {row.cashTxnPercentage}% {row.isCashLimitCompliant ? "(≤5% OK)" : "(>5% Alert)"}
          </span>
        </div>
      )
    },
    {
      header: "Statutory Due Date",
      cell: (row) => (
        <div>
          <span className="font-mono text-xs font-medium text-foreground/80 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> {row.dueDate}
          </span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Sec 44AB Report</span>
        </div>
      )
    },
    {
      header: "Stage / Progress",
      cell: (row) => (
        <div>
          <StatusBadge status={row.stage} />
          <p className="text-[10px] text-muted-foreground mt-1 font-medium">
            3CD: {row.verifiedClausesCount} / {row.totalClausesCount} verified
          </p>
          {row.udin && (
            <span className="font-mono text-[9px] text-primary bg-primary-muted px-1 py-0.2 rounded mt-0.5 block font-bold truncate max-w-[140px]">
              UDIN: {row.udin}
            </span>
          )}
        </div>
      )
    },
    {
      header: "Assigned Auditor",
      cell: (row) => (
        <span className="text-xs text-foreground/80 font-medium">
          {row.assignedAuditorName || "Unassigned"}
        </span>
      )
    },
    {
      header: "Actions",
      cell: (row) => {
        const nextStage = getNextStage(row.stage);
        return (
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="text-[11px] h-7 px-2"
              onClick={() => setSelectedAudit(row)}
            >
              Stepper
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-[11px] h-7 px-2 text-primary border-primary/20 hover:bg-primary-muted"
              onClick={() => setClauseModalAudit(row)}
            >
              Clauses
            </Button>
            {nextStage && (
              <Button
                size="sm"
                className="text-[11px] h-7 px-2.5"
                rightIcon={<ArrowRight className="w-3 h-3" />}
                onClick={() => handleOpenAdvanceModal(row)}
              >
                Advance
              </Button>
            )}
            {row.stage === "CLIENT_ACCEPTED" && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Completed
              </span>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Form 3CA / 3CB / 3CD"
        title="Tax Audit"
        description="Section 44AB audit prep, Form 3CD clause review, UDIN tracking, and IT portal filing."
        actions={
          <Button
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-sm"
          >
            New Audit Engagement
          </Button>
        }
      />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-card border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Audit Engagements</span>
            <ClipboardCheck className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{summary.totalEngagements}</p>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">AY 2026-27 Engagements</span>
        </Card>

        <Card className="bg-card border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Form 3CA / 3CD (Corporate)</span>
            <FileSpreadsheet className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-primary dark:text-primary mt-2">{summary.form3CA3CDCount}</p>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">Pvt Ltd & LLP Entities</span>
        </Card>

        <Card className="bg-card border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Form 3CB / 3CD (Non-Corp)</span>
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-primary mt-2">{summary.form3CB3CDCount}</p>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">Firms & Proprietorships</span>
        </Card>

        <Card className="bg-card border-amber-200 dark:border-amber-800/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Pending UDIN / Filing</span>
            <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">{summary.pendingUdinCount}</p>
          <span className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 block font-medium">Due Date: 30 Sept 2026</span>
        </Card>
      </div>

      {/* Statutory Due Date Countdown Banner */}
      <Card className="bg-card border border-border p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-muted/20 rounded-lg border border-primary/20">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Statutory Deadlines: Tax Audit Report & Return Filing (AY 2026-27)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                • <strong>30th September 2026</strong>: Tax Audit Report (Form 3CA/3CB-3CD) upload by Auditor on IT portal.
                <br />
                • <strong>31st October 2026</strong>: Income Tax Return filing by client following Audit report acceptance.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs bg-primary-muted/30 border border-primary/20 text-primary font-semibold px-3 py-1.5 rounded-lg">
              Sec 44AB Cash Limit: ≤ 5% for ₹10 Cr Proviso
            </span>
          </div>
        </div>
      </Card>

      {/* Selected Audit Stepper Inspector */}
      {selectedAudit && (
        <Card className="bg-primary-muted/30 border-primary/20">
          <div className="flex items-center justify-between pb-3 border-b border-primary/20 dark:border-primary/20">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  {selectedAudit.clientName} — {selectedAudit.assessmentYear} ({selectedAudit.formType})
                </h3>
                <span className="text-xs font-mono bg-primary-muted/60 dark:bg-primary-muted/60 text-primary dark:text-primary font-semibold px-2 py-0.5 rounded">
                  {selectedAudit.pan}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Turnover: ₹{(selectedAudit.turnover / 10000000).toFixed(2)} Cr • Cash %: {selectedAudit.cashTxnPercentage}% • Statutory Due Date: {selectedAudit.dueDate}
                {selectedAudit.udin && <span className="ml-2 font-bold text-primary dark:text-primary">UDIN: {selectedAudit.udin}</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setClauseModalAudit(selectedAudit)}>
                Inspect Form 3CD Clauses
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedAudit(null)}>
                Close
              </Button>
            </div>
          </div>
          <div className="pt-2">
            <Stepper steps={auditSteps} currentStepId={selectedAudit.stage} />
          </div>
        </Card>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        {/* Stage Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: "ALL", label: "All Audits" },
            { id: "ENGAGEMENT", label: "Engagement" },
            { id: "BOOKS_AUDIT", label: "Books Audit" },
            { id: "FORM_3CD_PREP", label: "Form 3CD Prep" },
            { id: "UDIN_GENERATED", label: "UDIN Sign-off" },
            { id: "PORTAL_FILED", label: "Portal Filed" },
            { id: "CLIENT_ACCEPTED", label: "Accepted" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStageFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-smooth whitespace-nowrap ${
                stageFilter === tab.id
                  ? "bg-primary-muted text-white font-semibold shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Form Type Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search Client or PAN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-44"
            />
          </div>

          <select
            value={formTypeFilter}
            onChange={(e) => setFormTypeFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg border border-border bg-card text-foreground/80 focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="ALL">All Form Types</option>
            <option value="FORM_3CA_3CD">Form 3CA-3CD (Corp)</option>
            <option value="FORM_3CB_3CD">Form 3CB-3CD (Non-Corp)</option>
          </select>
        </div>
      </div>

      {/* Tax Audit Engagements Table */}
      <Table
        columns={columns}
        data={auditsData?.data || []}
        isLoading={isLoading}
        emptyText="No Section 44AB tax audit records found matching your filters."
      />

      {/* Add Tax Audit Modal */}
      <AddTaxAuditModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {/* Form 3CD Clauses Review Modal */}
      {clauseModalAudit && (
        <Modal
          isOpen={true}
          onClose={() => setClauseModalAudit(null)}
          title={`Form 3CD Clause Checklist: ${clauseModalAudit.clientName}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="p-3 bg-primary-muted border border-primary/20 rounded-xl text-xs text-primary dark:text-primary flex items-center justify-between">
              <div>
                <span className="font-bold">Form 3CD Statutory Audit Working Papers</span>
                <p className="text-[11px] text-primary dark:text-primary mt-0.5">
                  Assessment Year: {clauseModalAudit.assessmentYear} • Form: {clauseModalAudit.formType}
                </p>
              </div>
              <span className="text-xs font-bold bg-primary-muted/80 dark:bg-primary-muted/80 text-primary dark:text-primary px-2.5 py-1 rounded-full">
                {clausesData?.data?.filter((c: any) => c.status === "VERIFIED").length || 0} /{" "}
                {clausesData?.data?.length || 9} Verified
              </span>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 text-xs">
              {clausesData?.data?.map((clause: any) => (
                <div
                  key={clause.clauseNumber}
                  className="p-3 rounded-lg border border-border bg-card hover:border-primary/40 transition-smooth"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary bg-primary-muted px-2 py-0.5 rounded border border-primary/20">
                          Clause {clause.clauseNumber}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">{clause.category}</span>
                      </div>
                      <h4 className="font-semibold text-foreground mt-1">{clause.title}</h4>
                      {clause.remarks && (
                        <p className="text-[11px] text-muted-foreground bg-muted p-1.5 rounded mt-1 border border-slate-100 dark:border-slate-750">
                          Auditor Note: {clause.remarks}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleClauseStatusToggle(clause.clauseNumber, clause.status)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold shrink-0 transition-smooth ${
                        clause.status === "VERIFIED"
                          ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900"
                          : clause.status === "FLAGGED"
                          ? "bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900"
                          : "bg-muted text-foreground/80 hover:bg-muted"
                      }`}
                    >
                      {clause.status === "VERIFIED"
                        ? "✓ Verified"
                        : clause.status === "FLAGGED"
                        ? "⚠ Flagged (MSME/TDS)"
                        : "Mark Verified"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <Button onClick={() => setClauseModalAudit(null)}>Close Checklist</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Advance Audit Stage Modal */}
      {advanceModalAudit && (
        <Modal
          isOpen={true}
          onClose={() => setAdvanceModalAudit(null)}
          title={`Advance Audit Stage: ${advanceModalAudit.clientName}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-muted border border-border rounded-xl">
              <span className="font-semibold text-foreground/80">Transitioning Stage:</span>
              <div className="flex items-center gap-2 mt-1 font-bold text-foreground">
                <StatusBadge status={advanceModalAudit.stage} />
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <StatusBadge status={targetStage} />
              </div>
            </div>

            {advanceError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-lg font-medium">
                {advanceError}
              </div>
            )}

            {targetStage === "UDIN_GENERATED" && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-foreground/80">
                  Enter 18-Character ICAI UDIN:
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    className="pl-8 uppercase font-mono font-bold"
                    placeholder="e.g. 26123456AAAAAB1234"
                    maxLength={18}
                    value={udinInput}
                    onChange={(e) => setUdinInput(e.target.value.toUpperCase())}
                    helperText="Mandatory Unique Document Identification Number issued by ICAI portal"
                  />
                </div>
              </div>
            )}

            {targetStage === "PORTAL_FILED" && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-foreground/80">
                  Income Tax e-Filing Acknowledgement Number:
                </label>
                <Input
                  className="font-mono"
                  placeholder="e.g. ACK9823471029"
                  value={ackInput}
                  onChange={(e) => setAckInput(e.target.value)}
                  helperText="Generated upon uploading JSON audit report on IT Portal"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button variant="outline" onClick={() => setAdvanceModalAudit(null)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmAdvance} isLoading={isUpdatingStage}>
                Confirm Stage Transition
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
