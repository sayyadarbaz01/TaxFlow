import React, { useState } from "react";
import {
  FileBadge,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowRight,
  Search,
  Building2,
  RefreshCw,
  Clock,
  Send,
  FileCheck
} from "lucide-react";
import {
  useGetGstRegistrationsQuery,
  useGetGstRegistrationSummaryQuery,
  useAdvanceGstRegStageMutation,
  useSyncGstRegistrationToClientMutation
} from "../../lib/api";
import { Table, Column } from "../../components/ui/Table";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Stepper, Step } from "../../components/ui/Stepper";
import { AddGstRegistrationModal } from "./AddGstRegistrationModal";
import { GstRegistrationRecord, GstRegStage } from "@ca-saas/shared-types";

export const GstRegistrationPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<GstRegistrationRecord | null>(null);

  // Advance Stage modal state
  const [advanceModalApp, setAdvanceModalApp] = useState<GstRegistrationRecord | null>(null);
  const [targetStage, setTargetStage] = useState<GstRegStage>("ARN_SUBMITTED");
  const [arnInput, setArnInput] = useState("");
  const [gstinInput, setGstinInput] = useState("");
  const [noticeRefInput, setNoticeRefInput] = useState("");
  const [advanceError, setAdvanceError] = useState("");

  // Sync state
  const [syncToast, setSyncToast] = useState("");

  const { data: summaryData } = useGetGstRegistrationSummaryQuery();
  const { data: listData, isLoading } = useGetGstRegistrationsQuery({
    search: search || undefined,
    stage: stageFilter !== "ALL" ? stageFilter : undefined,
    registrationType: typeFilter !== "ALL" ? typeFilter : undefined
  });

  const [advanceStage, { isLoading: isAdvancing }] = useAdvanceGstRegStageMutation();
  const [syncToClient, { isLoading: isSyncing }] = useSyncGstRegistrationToClientMutation();

  const summary = summaryData?.data || {
    totalPipeline: 0,
    trnDrafts: 0,
    arnSubmitted: 0,
    noticesPending: 0,
    certificatesIssued: 0
  };

  const gstSteps: Step[] = [
    { id: "TRN_GENERATED", label: "TRN Part A", description: "PAN/OTP Verified" },
    { id: "ARN_SUBMITTED", label: "ARN Part B", description: "Application Filed" },
    { id: "AADHAAR_AUTH", label: "Aadhaar Auth", description: "Promoter Biometric" },
    { id: "CLARIFICATION_PENDING", label: "Officer Review", description: "Notice / Reply" },
    { id: "APPROVED_ISSUED", label: "GSTIN Issued", description: "Form GST REG-06" }
  ];

  const getNextStage = (current: GstRegStage): GstRegStage | null => {
    const sequence: GstRegStage[] = [
      "TRN_GENERATED",
      "ARN_SUBMITTED",
      "AADHAAR_AUTH",
      "CLARIFICATION_PENDING",
      "APPROVED_ISSUED"
    ];
    const idx = sequence.indexOf(current);
    return idx >= 0 && idx < sequence.length - 1 ? sequence[idx + 1] : null;
  };

  const handleOpenAdvanceModal = (app: GstRegistrationRecord) => {
    const next = getNextStage(app.stage);
    if (!next) return;
    setAdvanceModalApp(app);
    setTargetStage(next);
    setArnInput(app.arn || "");
    const stateCode = app.state.includes("(") ? app.state.split("(")[1].replace(")", "").trim() : "27";
    setGstinInput(app.gstin || `${stateCode}${app.pan}1Z5`);
    setNoticeRefInput(app.queryNoticeRef || "");
    setAdvanceError("");
  };

  const handleConfirmAdvance = async () => {
    if (!advanceModalApp) return;
    setAdvanceError("");

    try {
      await advanceStage({
        id: advanceModalApp.id,
        stage: targetStage,
        arn: arnInput.trim() || undefined,
        gstin: gstinInput.trim() || undefined,
        queryNoticeRef: noticeRefInput.trim() || undefined
      }).unwrap();

      setAdvanceModalApp(null);
      if (selectedApp?.id === advanceModalApp.id) {
        setSelectedApp((prev) =>
          prev
            ? {
                ...prev,
                stage: targetStage,
                arn: arnInput.trim() || prev.arn,
                gstin: gstinInput.trim() || prev.gstin
              }
            : null
        );
      }
    } catch (err: any) {
      setAdvanceError(err?.data?.error?.message || "Failed to advance registration stage.");
    }
  };

  const handleSyncClient = async (id: string) => {
    try {
      const res = await syncToClient(id).unwrap();
      setSyncToast(res.message || "GSTIN successfully synced to Client CRM!");
      setTimeout(() => setSyncToast(""), 5000);
    } catch (err: any) {
      alert(err?.data?.error?.message || "Failed to sync GSTIN to Client CRM.");
    }
  };

  const columns: Column<GstRegistrationRecord>[] = [
    {
      header: "Applicant / Business",
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-xs">{row.businessName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
              {row.pan}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">({row.entityType})</span>
          </div>
        </div>
      )
    },
    {
      header: "Category & State",
      cell: (row) => (
        <div>
          <span className="font-semibold text-xs text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            {row.registrationType}
          </span>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">{row.state}</p>
        </div>
      )
    },
    {
      header: "TRN / ARN",
      cell: (row) => (
        <div className="font-mono text-xs">
          {row.arn ? (
            <div>
              <span className="font-bold text-slate-900 block">ARN: {row.arn}</span>
              <span className="text-[10px] text-slate-400">Filed: {row.submissionDate || "Recent"}</span>
            </div>
          ) : row.trn ? (
            <div>
              <span className="text-slate-700 font-medium block">TRN: {row.trn}</span>
              <span className="text-[10px] text-amber-600 font-medium">Part A Done</span>
            </div>
          ) : (
            <span className="text-slate-400 italic text-[11px]">Pending TRN</span>
          )}
        </div>
      )
    },
    {
      header: "Status / GSTIN",
      cell: (row) => (
        <div>
          <StatusBadge status={row.stage} />
          {row.gstin ? (
            <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded mt-1 block">
              {row.gstin}
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Aadhaar: {row.aadhaarAuthStatus}
            </span>
          )}
        </div>
      )
    },
    {
      header: "Assigned Staff",
      cell: (row) => (
        <div>
          <span className="text-xs text-slate-700 font-medium block">
            {row.assignedStaffName || "Unassigned"}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">{row.contactPhone}</span>
        </div>
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
              onClick={() => setSelectedApp(row)}
            >
              Stepper
            </Button>
            {nextStage && (
              <Button
                size="sm"
                className="text-[11px] h-7 px-2.5 bg-amber-600 hover:bg-amber-700 text-white"
                rightIcon={<ArrowRight className="w-3 h-3" />}
                onClick={() => handleOpenAdvanceModal(row)}
              >
                Advance
              </Button>
            )}
            {row.stage === "APPROVED_ISSUED" && row.gstin && (
              <Button
                size="sm"
                variant="outline"
                className="text-[11px] h-7 px-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-semibold"
                leftIcon={<RefreshCw className="w-3 h-3 text-emerald-600" />}
                isLoading={isSyncing}
                onClick={() => handleSyncClient(row.id)}
              >
                Sync CRM
              </Button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {syncToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              GST Registration Center
            </h1>
            <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
              Form GST REG-01
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            New GST Network applications, TRN/ARN submission tracking, promoter Aadhaar authentication, and REG-06 certificate issuance.
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-sm bg-amber-600 hover:bg-amber-700 text-white"
        >
          New GST Registration
        </Button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Applications</span>
            <FileBadge className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{summary.totalPipeline}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Total Onboarding Pipeline</span>
        </Card>

        <Card className="bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">TRN Drafts (Part A)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">{summary.trnDrafts}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Valid 15 Days for Part B</span>
        </Card>

        <Card className="bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">ARN Submitted (Part B)</span>
            <Send className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-700 mt-2">{summary.arnSubmitted}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Pending Officer Verification</span>
        </Card>

        <Card className="bg-white border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Certificates Issued (REG-06)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{summary.certificatesIssued}</p>
          <span className="text-[11px] text-emerald-700 mt-0.5 block font-medium">15-Digit GSTIN Assigned</span>
        </Card>
      </div>

      {/* Selected Application Stepper Inspector */}
      {selectedApp && (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">{selectedApp.businessName}</h3>
                <span className="text-xs font-mono bg-amber-200/60 text-amber-900 font-semibold px-2 py-0.5 rounded">
                  {selectedApp.pan}
                </span>
                <span className="text-xs font-semibold text-slate-600">({selectedApp.state})</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Type: {selectedApp.registrationType} • {selectedApp.jurisdictionWard}
                {selectedApp.arn && <span className="ml-2 font-bold text-slate-800">ARN: {selectedApp.arn}</span>}
                {selectedApp.gstin && (
                  <span className="ml-2 font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                    GSTIN: {selectedApp.gstin}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedApp.gstin && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-emerald-700 border-emerald-300"
                  onClick={() => handleSyncClient(selectedApp.id)}
                >
                  Sync to Client CRM
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setSelectedApp(null)}>
                Close
              </Button>
            </div>
          </div>
          <div className="pt-2">
            <Stepper steps={gstSteps} currentStepId={selectedApp.stage} />
          </div>
        </Card>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        {/* Stage Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: "ALL", label: "All Applications" },
            { id: "TRN_GENERATED", label: "TRN Drafts" },
            { id: "ARN_SUBMITTED", label: "ARN Submitted" },
            { id: "AADHAAR_AUTH", label: "Aadhaar Auth" },
            { id: "CLARIFICATION_PENDING", label: "Notices / Queries" },
            { id: "APPROVED_ISSUED", label: "GSTIN Issued" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStageFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-smooth whitespace-nowrap ${
                stageFilter === tab.id
                  ? "bg-amber-600 text-white font-semibold shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Business, PAN, ARN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 w-48"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="ALL">All Categories</option>
            <option value="REGULAR">Regular Taxpayer</option>
            <option value="COMPOSITION">Composition</option>
            <option value="VOLUNTARY">Voluntary</option>
            <option value="CASUAL">Casual</option>
          </select>
        </div>
      </div>

      {/* Registrations Table */}
      <Table
        columns={columns}
        data={listData?.data || []}
        isLoading={isLoading}
        emptyText="No GST registration applications found matching your filters."
      />

      {/* Add GST Registration Modal */}
      <AddGstRegistrationModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {/* Advance Registration Stage Modal */}
      {advanceModalApp && (
        <Modal
          isOpen={true}
          onClose={() => setAdvanceModalApp(null)}
          title={`Advance GST Registration: ${advanceModalApp.businessName}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="font-semibold text-slate-700">Transitioning Stage:</span>
              <div className="flex items-center gap-2 mt-1 font-bold text-slate-900">
                <StatusBadge status={advanceModalApp.stage} />
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <StatusBadge status={targetStage} />
              </div>
            </div>

            {advanceError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
                {advanceError}
              </div>
            )}

            {targetStage === "ARN_SUBMITTED" && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700">
                  Application Reference Number (ARN):
                </label>
                <Input
                  className="font-mono uppercase font-bold"
                  placeholder="e.g. AA270926001234Z"
                  value={arnInput}
                  onChange={(e) => setArnInput(e.target.value.toUpperCase())}
                  helperText="15-character ARN generated upon Part B portal submission"
                />
              </div>
            )}

            {targetStage === "CLARIFICATION_PENDING" && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700">
                  Form GST REG-03 Query / Notice Reference:
                </label>
                <Input
                  placeholder="e.g. REG-03/NOT/2026/89401"
                  value={noticeRefInput}
                  onChange={(e) => setNoticeRefInput(e.target.value)}
                  helperText="Show-cause notice from tax officer requiring clarification reply (REG-04)"
                />
              </div>
            )}

            {targetStage === "APPROVED_ISSUED" && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700">
                  15-Character Approved GSTIN (Form GST REG-06):
                </label>
                <Input
                  className="font-mono uppercase font-bold text-emerald-700"
                  placeholder="e.g. 27ABCDE1234F1Z5"
                  maxLength={15}
                  value={gstinInput}
                  onChange={(e) => setGstinInput(e.target.value.toUpperCase())}
                  helperText="Official GSTIN assigned to the business upon approval"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="outline" onClick={() => setAdvanceModalApp(null)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmAdvance} isLoading={isAdvancing}>
                Confirm Advance Stage
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
