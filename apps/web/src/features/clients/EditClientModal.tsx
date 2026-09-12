import React, { useState, useEffect } from "react";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { useUpdateClientMutation, useGetAdminUsersQuery } from "../../lib/api";
import { ClientRecord, EntityType, ClientWorkType } from "@ca-saas/shared-types";

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientRecord | null;
}

export const EditClientModal: React.FC<EditClientModalProps> = ({ isOpen, onClose, client }) => {
  const [name, setName] = useState("");
  const [entityType, setEntityType] = useState<EntityType>("PVT_LTD");
  const [pan, setPan] = useState("");
  const [gstin, setGstin] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [workType, setWorkType] = useState<ClientWorkType>("ITR");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE" | "ONBOARDING" | "LEAD">("ACTIVE");
  const [assignedStaffId, setAssignedStaffId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState("");

  const [updateClient, { isLoading }] = useUpdateClientMutation();
  const { data: staffData } = useGetAdminUsersQuery({});

  useEffect(() => {
    if (client) {
      setName(client.name || "");
      setEntityType((client.entityType as EntityType) || "PVT_LTD");
      setPan(client.pan || "");
      setGstin(client.gstin || "");
      setContactPhone(client.contactPhone || "");
      setContactEmail(client.contactEmail || "");
      setWorkType((client.workType as ClientWorkType) || "ITR");
      setStatus(client.status || "ACTIVE");
      setAssignedStaffId(client.assignedStaffId || "");
      setErrorMsg("");
    }
  }, [client, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!client) return;

    if (!name.trim()) {
      return setErrorMsg("Client Name is required");
    }
    if (name.trim().length < 2) {
      return setErrorMsg("Client Name must be at least 2 characters");
    }

    const cleanPan = pan.trim().toUpperCase();
    if (!cleanPan) {
      return setErrorMsg("PAN number is required");
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
      return setErrorMsg("Contact phone number is required");
    }
    if (cleanPhone.replace(/\D/g, "").length < 10) {
      return setErrorMsg("Valid phone number required (at least 10 digits)");
    }

    const cleanEmail = contactEmail.trim();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return setErrorMsg("Valid email address required (e.g. name@company.com)");
    }

    try {
      await updateClient({
        id: client.id,
        name: name.trim(),
        entityType,
        pan: cleanPan,
        gstin: cleanGstin ? cleanGstin : null,
        contactPhone: cleanPhone,
        contactEmail: cleanEmail ? cleanEmail : null,
        workType,
        status,
        assignedStaffId: assignedStaffId ? assignedStaffId : null
      }).unwrap();

      onClose();
    } catch (err: any) {
      const apiErr = err.data?.error;
      if (apiErr?.details && typeof apiErr.details === "object") {
        const detailMsgs = Object.entries(apiErr.details)
          .map(([field, msgs]) => `${field.toUpperCase()}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
          .join(" | ");
        setErrorMsg(detailMsgs || apiErr.message || "Failed to update client");
      } else {
        setErrorMsg(apiErr?.message || err.error || err.message || "Failed to update client. Please check your inputs.");
      }
    }
  };

  const userList: any[] = Array.isArray(staffData?.data)
    ? staffData.data
    : Array.isArray(staffData)
    ? staffData
    : [];

  const staffOptions = [
    { value: "", label: "Unassigned" },
    ...userList.map((u: any) => ({
      value: u.id,
      label: `${u.name} (${typeof u.role === "string" ? u.role : u.role?.name || "Staff"})`
    }))
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Client: ${client?.name || ""}`} maxWidth="lg">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {errorMsg && (
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-lg font-medium">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Input
              label="Client / Entity Legal Name"
              placeholder="e.g. Acme Technologies Pvt Ltd"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

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

          <Select
            label="Scope of Work / Service"
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

          <Input
            label="Permanent Account Number (PAN)"
            placeholder="ABCDE1234F"
            value={pan}
            onChange={(e) => setPan(e.target.value.toUpperCase())}
          />

          <Input
            label="GSTIN (Optional)"
            placeholder="15 Characters (e.g. 27ABCDE1234F1Z5)"
            value={gstin}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
          />

          <Input
            label="Primary Mobile / WhatsApp Phone"
            placeholder="10 digit phone number"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />

          <Input
            label="Contact Email (Optional)"
            type="email"
            placeholder="finance@client.com (Optional)"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />

          <Select
            label="Client Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            options={[
              { value: "ACTIVE", label: "Active" },
              { value: "ONBOARDING", label: "Onboarding" },
              { value: "LEAD", label: "Lead" },
              { value: "INACTIVE", label: "Inactive" }
            ]}
          />

          <Select
            label="Assigned Staff Member"
            value={assignedStaffId}
            onChange={(e) => setAssignedStaffId(e.target.value)}
            options={staffOptions}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button size="sm" type="submit" isLoading={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
