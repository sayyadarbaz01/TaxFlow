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
  const [gstin, setGstin] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [workType, setWorkType] = useState<ClientWorkType>("ITR");
  const [assignedStaffId, setAssignedStaffId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState("");

  const [createClient, { isLoading }] = useCreateClientMutation();
  const { data: staffData } = useGetAdminUsersQuery({});

  const handleClose = () => {
    setName("");
    setEntityType("INDIVIDUAL");
    setPan("");
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

    const cleanPan = pan.trim().toUpperCase();
    if (cleanPan && !PAN_REGEX.test(cleanPan)) {
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
        pan: cleanPan || undefined,
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
        <div className="p-3 bg-primary-muted border border-primary/20 rounded-xl text-xs text-primary dark:text-primary flex items-start gap-2.5">
          <UserPlus className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Prospective Client Intake:</span>
            <p className="text-primary dark:text-primary text-[11px] mt-0.5">
              This client will be saved with status <span className="font-semibold bg-primary-muted/60 dark:bg-primary-muted/60 px-1 py-0.5 rounded text-primary dark:text-primary">LEAD</span>. You can track communication, schedule follow-ups, and convert them to an Active Client once engaged.
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

          <div className="sm:col-span-2">
            <Input
              label="Permanent Account Number (PAN) (Optional for Leads)"
              placeholder="e.g. ABCDE1234F (Can be added/updated later)"
              value={pan}
              onChange={(e) => setPan(e.target.value.toUpperCase())}
              helperText="PAN is optional when creating a lead client and can be provided anytime later."
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

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
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
