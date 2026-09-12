import React, { useState } from "react";
import {
  FileText,
  Layers,
  ShieldCheck,
  PlusCircle,
  Calculator,
  Briefcase,
  Check
} from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Stepper } from "../../components/ui/Stepper";
import { useCreateClientMutation } from "../../lib/api";
import { EntityType, ClientWorkType } from "@ca-saas/shared-types";

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export interface ClientOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WorkTypeOption {
  value: ClientWorkType;
  title: string;
  badge: string;
  description: string;
  recommendedFor: string;
  icon: React.ReactNode;
}

const WORK_TYPE_OPTIONS: WorkTypeOption[] = [
  {
    value: "ITR",
    title: "Income Tax Return (ITR)",
    badge: "Direct Tax",
    description: "Annual ITR filings (ITR-1 to 7), AIS/26AS reconciliation, and tax computation.",
    recommendedFor: "Salaried individuals, professionals, and non-audit firms",
    icon: <FileText className="w-4 h-4 text-blue-600" />
  },
  {
    value: "GST",
    title: "GST Returns (GSTR-1 / 3B)",
    badge: "Indirect Tax",
    description: "Monthly/Quarterly GSTR-1, GSTR-3B filings, ITC 2B matching, and outward sales.",
    recommendedFor: "Trading businesses, manufacturers, and regular GST taxpayers",
    icon: <Layers className="w-4 h-4 text-emerald-600" />
  },
  {
    value: "Tax Audit",
    title: "Tax Audit (Sec 44AB)",
    badge: "Audit & Assurance",
    description: "Statutory tax audit under Section 44AB/44AD/ADA, Form 3CA/3CB-3CD preparation.",
    recommendedFor: "Businesses > ₹1 Cr (or ₹10 Cr digital) & Professionals > ₹50 Lakhs turnover",
    icon: <ShieldCheck className="w-4 h-4 text-purple-600" />
  },
  {
    value: "GST Registration",
    title: "GST Registration",
    badge: "New Setup",
    description: "Fresh GSTIN application, jurisdictional approval follow-up, and core amendments.",
    recommendedFor: "New startups, branch expansion, or voluntary registrations",
    icon: <PlusCircle className="w-4 h-4 text-amber-600" />
  },
  {
    value: "TDS/TCS",
    title: "TDS / TCS Compliance",
    badge: "Withholding Tax",
    description: "Quarterly returns (24Q/26Q/27Q), TRACES challan validation & Form 16/16A generation.",
    recommendedFor: "Employers, deductors paying rent, contractors or professional fees",
    icon: <Calculator className="w-4 h-4 text-cyan-600" />
  },
  {
    value: "ITR + GST",
    title: "ITR + GST Package",
    badge: "Combined Retainer",
    description: "Full-spectrum CA retainer covering both Income Tax and GST compliance workflows.",
    recommendedFor: "Corporate entities, Pvt Ltds, LLPs & active business clients",
    icon: <Briefcase className="w-4 h-4 text-indigo-600" />
  }
];

export const ClientOnboardingModal: React.FC<ClientOnboardingModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState("1");
  const [name, setName] = useState("");
  const [pan, setPan] = useState("");
  const [gstin, setGstin] = useState("");
  const [entityType, setEntityType] = useState<EntityType>("PVT_LTD");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [workType, setWorkType] = useState<ClientWorkType>("ITR");
  const [errorMsg, setErrorMsg] = useState("");

  const [createClient, { isLoading }] = useCreateClientMutation();

  const steps = [
    { id: "1", label: "Basic Info" },
    { id: "2", label: "Tax Identifiers" },
    { id: "3", label: "Contact Details" },
    { id: "4", label: "Scope of Work" },
    { id: "5", label: "Review & Create" }
  ];

  const handleNext = () => {
    setErrorMsg("");
    if (currentStep === "1") {
      if (!name.trim()) {
        return setErrorMsg("Client Name is required");
      }
      if (name.trim().length < 2) {
        return setErrorMsg("Client Name must be at least 2 characters");
      }
    }
    if (currentStep === "2") {
      const cleanPan = pan.trim().toUpperCase();
      const cleanGstin = gstin.trim().toUpperCase();

      if (!cleanPan) {
        return setErrorMsg("PAN number is required");
      }
      if (!PAN_REGEX.test(cleanPan)) {
        return setErrorMsg("Invalid PAN format (e.g. ABCDE1234F - 5 letters, 4 digits, 1 letter)");
      }
      if (cleanGstin && !GSTIN_REGEX.test(cleanGstin)) {
        return setErrorMsg("Invalid GSTIN format (e.g. 27ABCDE1234F1Z5 - 15 alphanumeric characters)");
      }
    }
    if (currentStep === "3") {
      const cleanPhone = contactPhone.trim();
      const cleanEmail = contactEmail.trim();

      if (!cleanPhone) {
        return setErrorMsg("Contact phone number is required");
      }
      if (cleanPhone.replace(/\D/g, "").length < 10) {
        return setErrorMsg("Valid phone number required (at least 10 digits)");
      }
      // Email is strictly optional. If provided, validate email format.
      if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return setErrorMsg("Valid email address required (e.g. name@company.com)");
      }
    }
    if (currentStep === "4") {
      if (!workType) {
        return setErrorMsg("Please select a Scope of Work for this client");
      }
    }

    setCurrentStep(String(parseInt(currentStep, 10) + 1));
  };

  const handleSubmit = async () => {
    setErrorMsg("");
    try {
      await createClient({
        name: name.trim(),
        pan: pan.trim().toUpperCase(),
        gstin: gstin.trim() ? gstin.trim().toUpperCase() : undefined,
        entityType,
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim() || undefined,
        workType,
        status: "ACTIVE"
      }).unwrap();
      handleClose();
    } catch (err: any) {
      const apiErr = err.data?.error;
      if (apiErr?.details && typeof apiErr.details === "object") {
        const detailMsgs = Object.entries(apiErr.details)
          .map(([field, msgs]) => `${field.toUpperCase()}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
          .join(" | ");
        setErrorMsg(detailMsgs || apiErr.message || "Failed to create client");
      } else {
        setErrorMsg(apiErr?.message || "Failed to create client");
      }
    }
  };

  const resetForm = () => {
    setCurrentStep("1");
    setName("");
    setPan("");
    setGstin("");
    setEntityType("PVT_LTD");
    setContactPhone("");
    setContactEmail("");
    setWorkType("ITR");
    setErrorMsg("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleBack = () => {
    setErrorMsg("");
    setCurrentStep(String(parseInt(currentStep, 10) - 1));
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Client (Onboarding Wizard)" maxWidth="lg">
      <div className="space-y-4">
        <Stepper steps={steps} currentStepId={currentStep} />

        {errorMsg && (
          <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg font-medium">
            {errorMsg}
          </div>
        )}

        {currentStep === "1" && (
          <div className="space-y-3">
            <Input
              label="Legal Entity / Client Name"
              placeholder="e.g. Acme Technologies Pvt Ltd"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Select
              label="Entity Type"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value as any)}
              options={[
                { value: "PVT_LTD", label: "Private Limited Company (Pvt Ltd)" },
                { value: "PROPRIETORSHIP", label: "Sole Proprietorship" },
                { value: "PARTNERSHIP", label: "Partnership Firm" },
                { value: "LLP", label: "Limited Liability Partnership (LLP)" },
                { value: "INDIVIDUAL", label: "Individual Taxpayer" },
                { value: "TRUST", label: "Trust / Society" }
              ]}
            />
          </div>
        )}

        {currentStep === "2" && (
          <div className="space-y-3">
            <Input
              label="Permanent Account Number (PAN)"
              placeholder="5 Letters, 4 Digits, 1 Letter (e.g. ABCDE1234F)"
              value={pan}
              onChange={(e) => setPan(e.target.value.toUpperCase())}
            />
            <Input
              label="GSTIN (Optional)"
              placeholder="15 Characters (e.g. 27ABCDE1234F1Z5)"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
            />
          </div>
        )}

        {currentStep === "3" && (
          <div className="space-y-3">
            <Input
              label="Primary Mobile / WhatsApp Phone"
              placeholder="10 digit phone number"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
            <div>
              <Input
                label="Official Contact Email (Optional)"
                type="email"
                placeholder="finance@client.com (Optional)"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Optional: Leave blank if client only communicates via WhatsApp or Phone.
              </p>
            </div>
          </div>
        )}

        {currentStep === "4" && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Select Scope of Work / Engagement Type <span className="text-rose-500">*</span>
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Choose the primary service scope for this client. Workflows, filing calendars, and task templates will be automatically configured.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {WORK_TYPE_OPTIONS.map((opt) => {
                const isSelected = workType === opt.value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => setWorkType(opt.value)}
                    className={`cursor-pointer p-3 rounded-xl border transition-all duration-150 flex flex-col justify-between relative text-left ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${isSelected ? "bg-blue-100" : "bg-slate-100"}`}>
                            {opt.icon}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block leading-tight">{opt.title}</span>
                            <span className={`inline-block text-[9px] font-semibold px-1.5 py-0.2 rounded mt-0.5 ${
                              isSelected ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                            }`}>
                              {opt.badge}
                            </span>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-2 leading-snug">
                        {opt.description}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 font-medium border-t border-slate-100 pt-1">
                      💡 {opt.recommendedFor}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {currentStep === "5" && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-3">
            <h4 className="font-bold text-slate-900 border-b border-slate-200/80 pb-1.5">Summary Review</h4>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <p className="text-slate-500 text-[11px]">Client / Entity Name</p>
                <p className="font-semibold text-slate-900">{name}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[11px]">Entity Type</p>
                <p className="font-semibold text-slate-900">{entityType}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[11px]">PAN</p>
                <p className="font-mono font-semibold text-slate-900">{pan}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[11px]">GSTIN</p>
                <p className="font-mono font-semibold text-slate-900">{gstin || "Not Applicable"}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[11px]">Phone</p>
                <p className="font-semibold text-slate-900">{contactPhone}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[11px]">Email</p>
                <p className="font-semibold text-slate-900">{contactEmail.trim() || "Not Provided (Optional)"}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/80">
              <p className="text-slate-500 text-[11px]">Scope of Work / Service</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  {workType}
                </span>
                <span className="text-[11px] text-slate-700 font-medium">
                  {WORK_TYPE_OPTIONS.find((o) => o.value === workType)?.title}
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg text-[11px] text-blue-700 font-medium">
              ⚡ Upon creation, compliance schedules, filings ({workType}), and document checklists will be generated automatically.
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          {currentStep !== "1" && (
            <Button variant="secondary" size="sm" onClick={handleBack}>
              Back
            </Button>
          )}
          {currentStep !== "5" ? (
            <Button size="sm" onClick={handleNext}>
              Next Step
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit} isLoading={isLoading}>
              Confirm & Onboard Client
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
