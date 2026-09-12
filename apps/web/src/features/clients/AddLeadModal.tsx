import React, { useState } from "react";
import { UserPlus, Sparkles, AlertCircle } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { useCreateClientMutation, useGetAdminUsersQuery } from "../../lib/api";
import { EntityType, ClientWorkType } from "@ca-saas/shared-types";

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState("");
  const [entityType, setEntityType] = useState<EntityType>("INDIVIDUAL");
  const [pan, setPan] = useState("");
  const [isProvisionalPan, setIsProvisionalPan] = useState(false);
  const [gstin, setGstin] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [workType, setWorkType] = useState<ClientWorkType>("ITR");
  const [assignedStaffId, setAssignedStaffId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState("");

  const [createClient, { isLoading }] = useCreateClientMutation();
  const { data: staffData } = useGetAdminUsersQuery({});

  const generateProvisionalPan = () => {
    // Generate valid 10-char PAN: LEAD + 4 random digits + P
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `LEADP${randomDigits}L`;
  };

  const handleProvisionalToggle = (checked: boolean) => {
    setIsProvisionalPan(checked);
    if (checked) {
      setPan(generateProvisionalPan());
    } else {
      setPan("");
    }
  };

  const handleClose = () => {
    setName("");
    setEntityType("INDIVIDUAL");
    setPan("");
    setIsProvisionalPan(false);
    setGstin("");
    setContactPhone("");
    setContactEmail("");
    setWorkType("ITR");
    setAssignedStaffId("");
    setErrorMsg("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      return setErrorMsg("Lead / Prospect Name is required");
    }
    if (name.trim().length < 2) {
      return setErrorMsg("Lead Name must be at least 2 characters");
    }

    let cleanPan = pan.trim().toUpperCase();
    if (!cleanPan) {
      if (isProvisionalPan) {
        cleanPan = generateProvisionalPan();
        setPan(cleanPan);
      } else {
        return setErrorMsg("PAN number is required (or check 'Provisional Lead without PAN')");
      }
    }
    if (!PAN_REGEX.test(cleanPan)) {
      return setErrorMsg("Invalid PAN format (e.g. ABCDE1234F)");
    }

    const cleanGstin = gstin.trim().toUpperCase();
    if (cleanGstin && !GSTIN_REGEX.test(cleanGstin)) {
      return setErrorMsg("Invalid GSTIN format (e.g. 27ABCDE1234F1Z5)");
    }

    const cleanPhone = contactPhone.trim();
    if (!cleanPhone) {
      return setErrorMsg("Primary contact phone number is required");
    }
    if (cleanPhone.replace(/\D/g, "").length < 10) {
      return setErrorMsg("Valid phone number required (at least 10 digits)");
    }

    const cleanEmail = contactEmail.trim();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return setErrorMsg("Valid email address required (e.g. contact@client.com)");
    }

    try {
      await createClient({
        name: name.trim(),
        pan: cleanPan,
        gstin: cleanGstin || undefined,
        entityType,
        contactPhone: cleanPhone,
        contactEmail: cleanEmail || undefined,
        workType,
        assignedStaffId: assignedStaffId || undefined,
        status: "LEAD"
      }).unwrap();

      handleClose();
    } catch (err: any) {
      const apiErr = err.data?.error;
      if (apiErr?.details && typeof apiErr.details === "object") {
        const detailMsgs = Object.entries(apiErr.details)
          .map(([field, msgs]) => `${field.toUpperCase()}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
          .join(" | ");
        setErrorMsg(detailMsgs || apiErr.message || "Failed to create lead client");
      } else {
        setErrorMsg(apiErr?.message || err.error || err.message || "Failed to create lead client. Please check your inputs.");
      }
    }
  };

  const userList: any[] = Array.isArray(staffData?.data)
    ? staffData.data
    : Array.isArray(staffData)
    ? staffData
    : [];

  const staffOptions = [
    { value: "", label: "Unassigned (Default)" },
    ...userList.map((u: any) => ({
      value: u.id,
      label: `${u.name} (${typeof u.role === "string" ? u.role : u.role?.name || "Staff"})`
    }))
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Lead Client" maxWidth="lg">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Banner */}
        <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-xl text-xs text-purple-800 dark:text-purple-300 flex items-start gap-2.5">
          <UserPlus className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Prospective Client Intake:</span>
            <p className="text-purple-700 dark:text-purple-400 text-[11px] mt-0.5">
              This client will be saved with status <span className="font-semibold bg-purple-200/60 dark:bg-purple-900/60 px-1 py-0.5 rounded text-purple-900 dark:text-purple-200">LEAD</span>. You can track communication, schedule follow-ups, and convert them to an Active Client once engaged.
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
            <Input
              label="Prospect / Business Legal Name"
              placeholder="e.g. Apex Logistics or Ramesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <Select
            label="Entity Structure"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value as any)}
            options={[
              { value: "INDIVIDUAL", label: "Individual Taxpayer" },
              { value: "PROPRIETORSHIP", label: "Sole Proprietorship" },
              { value: "PARTNERSHIP", label: "Partnership Firm" },
              { value: "LLP", label: "Limited Liability Partnership (LLP)" },
              { value: "PVT_LTD", label: "Private Limited Company (Pvt Ltd)" },
              { value: "TRUST", label: "Trust / Society" }
            ]}
          />

          <Select
            label="Service / Work Scope Interested"
            value={workType}
            onChange={(e) => setWorkType(e.target.value as any)}
            options={[
              { value: "ITR", label: "ITR (Income Tax Return)" },
              { value: "GST", label: "GST (GST Returns - 1/3B)" },
              { value: "Tax Audit", label: "Tax Audit (Sec 44AB)" },
              { value: "GST Registration", label: "GST Registration & Setup" },
              { value: "TDS/TCS", label: "TDS / TCS Compliance" },
              { value: "ITR + GST", label: "ITR + GST Combined Retainer" }
            ]}
          />

          <div className="sm:col-span-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Permanent Account Number (PAN)</label>
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-purple-700 dark:text-purple-400 font-medium hover:text-purple-900 dark:hover:text-purple-300">
                <input
                  type="checkbox"
                  checked={isProvisionalPan}
                  onChange={(e) => handleProvisionalToggle(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                />
                <Sparkles className="w-3 h-3 text-purple-500" />
                <span>Provisional Lead (No PAN yet)</span>
              </label>
            </div>
            <Input
              placeholder={isProvisionalPan ? "Auto-generated provisional PAN" : "ABCDE1234F"}
              value={pan}
              disabled={isProvisionalPan}
              onChange={(e) => setPan(e.target.value.toUpperCase())}
            />
          </div>

          <Input
            label="GSTIN (Optional)"
            placeholder="15 Characters (e.g. 27ABCDE1234F1Z5)"
            value={gstin}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
          />

          <Input
            label="Primary Phone / WhatsApp"
            placeholder="10 digit mobile number"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />

          <Input
            label="Contact Email (Optional)"
            type="email"
            placeholder="contact@prospect.com (Optional)"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />

          <Select
            label="Assign Lead to Staff / Partner"
            value={assignedStaffId}
            onChange={(e) => setAssignedStaffId(e.target.value)}
            options={staffOptions}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" size="sm" type="button" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button size="sm" type="submit" isLoading={isLoading} leftIcon={<UserPlus className="w-3.5 h-3.5" />}>
            Create Lead Client
          </Button>
        </div>
      </form>
    </Modal>
  );
};
