import React, { useState } from "react";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { useCreateGstRegistrationMutation } from "../../lib/api";
import { GstRegType } from "@ca-saas/shared-types";
import { FileBadge, AlertCircle } from "lucide-react";

interface AddGstRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddGstRegistrationModal: React.FC<AddGstRegistrationModalProps> = ({ isOpen, onClose }) => {
  const [createGstReg, { isLoading }] = useCreateGstRegistrationMutation();

  const [businessName, setBusinessName] = useState("");
  const [pan, setPan] = useState("");
  const [entityType, setEntityType] = useState("PROPRIETORSHIP");
  const [registrationType, setRegistrationType] = useState<GstRegType>("REGULAR");
  const [state, setState] = useState("Maharashtra (27)");
  const [jurisdictionWard, setJurisdictionWard] = useState("State Ward-IV, Range-2");
  const [trn, setTrn] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!businessName.trim()) {
      setErrorMsg("Business or trade name is required.");
      return;
    }

    const cleanPan = pan.trim().toUpperCase();
    if (cleanPan.length !== 10) {
      setErrorMsg("Valid 10-character PAN is required.");
      return;
    }

    const cleanPhone = contactPhone.trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg("Valid 10-digit contact mobile number is required.");
      return;
    }

    try {
      await createGstReg({
        businessName: businessName.trim(),
        pan: cleanPan,
        entityType,
        registrationType,
        state,
        jurisdictionWard: jurisdictionWard.trim(),
        trn: trn.trim() || undefined,
        contactPhone: cleanPhone,
        contactEmail: contactEmail.trim() || undefined
      }).unwrap();

      onClose();
      // Reset form
      setBusinessName("");
      setPan("");
      setContactPhone("");
      setContactEmail("");
      setTrn("");
    } catch (err: any) {
      setErrorMsg(err?.data?.error?.message || "Failed to create GST registration.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New GST Registration Application (Form GST REG-01)" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info Banner */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
          <FileBadge className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">New GST Network (GSTN) Onboarding:</span>
            <p className="text-amber-800 text-[11px] mt-0.5">
              Tracks the lifecycle from Part A (TRN generation) through Part B (ARN submission & Aadhaar authentication) to final registration certificate (Form GST REG-06).
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Input
              label="Trade / Legal Business Name"
              placeholder="e.g. Zenith Logix Solutions or Rajesh Sharma"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
          </div>

          <Input
            label="Permanent Account Number (PAN)"
            placeholder="ABCDE1234F"
            value={pan}
            onChange={(e) => setPan(e.target.value.toUpperCase())}
            maxLength={10}
            required
          />

          <Select
            label="Entity Structure"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            options={[
              { value: "PROPRIETORSHIP", label: "Sole Proprietorship" },
              { value: "PARTNERSHIP", label: "Partnership Firm" },
              { value: "LLP", label: "Limited Liability Partnership (LLP)" },
              { value: "PVT_LTD", label: "Private Limited Company" },
              { value: "INDIVIDUAL", label: "Individual Taxpayer" }
            ]}
          />

          <Select
            label="Registration Nature / Category"
            value={registrationType}
            onChange={(e) => setRegistrationType(e.target.value as any)}
            options={[
              { value: "REGULAR", label: "Regular Taxpayer (Standard Input Tax Credit)" },
              { value: "COMPOSITION", label: "Composition Scheme Taxpayer" },
              { value: "VOLUNTARY", label: "Voluntary Registration (< Threshold)" },
              { value: "CASUAL", label: "Casual Taxable Person" },
              { value: "ISD", label: "Input Service Distributor (ISD)" }
            ]}
          />

          <Select
            label="State / Union Territory"
            value={state}
            onChange={(e) => setState(e.target.value)}
            options={[
              { value: "Maharashtra (27)", label: "Maharashtra (State Code: 27)" },
              { value: "Delhi (07)", label: "Delhi (State Code: 07)" },
              { value: "Karnataka (29)", label: "Karnataka (State Code: 29)" },
              { value: "Gujarat (24)", label: "Gujarat (State Code: 24)" },
              { value: "Tamil Nadu (33)", label: "Tamil Nadu (State Code: 33)" },
              { value: "Uttar Pradesh (09)", label: "Uttar Pradesh (State Code: 09)" }
            ]}
          />

          <div className="sm:col-span-2">
            <Input
              label="Jurisdictional Circle / Ward"
              placeholder="e.g. State Ward-IV, Range-2, Division Mumbai"
              value={jurisdictionWard}
              onChange={(e) => setJurisdictionWard(e.target.value)}
            />
          </div>

          <Input
            label="Primary Contact Mobile (for OTP / ARN)"
            placeholder="10 digit mobile number"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            required
          />

          <Input
            label="Contact Email"
            type="email"
            placeholder="accounts@business.in"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />

          <div className="sm:col-span-2">
            <Input
              label="Existing TRN (Optional - if Part A already filed)"
              placeholder="e.g. TRN260910002938491 (Leave blank to auto-generate)"
              value={trn}
              onChange={(e) => setTrn(e.target.value.toUpperCase())}
              helperText="Temporary Reference Number generated after Part A OTP verification"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Create GST Registration
          </Button>
        </div>
      </form>
    </Modal>
  );
};
