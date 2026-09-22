import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus,
  Search,
  Phone,
  Mail,
  Pencil,
  Trash2,
  Eye,
  CheckCircle2,
  ArrowRight,
  Briefcase,
  Layers,
  FileText,
  MessageSquare
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Table, Column } from "../../components/ui/Table";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useGetClientsQuery, useUpdateClientMutation } from "../../lib/api";
import { ClientRecord } from "@ca-saas/shared-types";
import { useDebounce } from "../../lib/useDebounce";
import { AddLeadModal } from "./AddLeadModal";
import { EditClientModal } from "./EditClientModal";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { PageHeader } from "../../components/ui/PageHeader";

export const LeadListPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [workTypeFilter, setWorkTypeFilter] = useState("");
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<ClientRecord | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<ClientRecord | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const navigate = useNavigate();

  const debouncedSearch = useDebounce(search, 250);

  // Query only clients with status "LEAD"
  const { data, isLoading } = useGetClientsQuery({
    search: debouncedSearch,
    status: "LEAD",
    entityType: entityFilter,
    workType: workTypeFilter || undefined
  });

  const [updateClient] = useUpdateClientMutation();

  const leads = useMemo(() => data?.data || [], [data?.data]);

  // Metrics with useMemo
  const totalLeads = leads.length;
  const itrLeads = useMemo(() => leads.filter((l: any) => l.workType === "ITR").length, [leads]);
  const gstLeads = useMemo(() => leads.filter((l: any) => l.workType === "GST").length, [leads]);
  const comboLeads = useMemo(() => leads.filter((l: any) => l.workType === "ITR + GST").length, [leads]);

  const handleConvertToActive = useCallback(
    async (lead: ClientRecord) => {
      try {
        setConvertingId(lead.id);
        await updateClient({
          id: lead.id,
          status: "ACTIVE"
        }).unwrap();
      } catch (err) {
        console.error("Failed to convert lead to active client:", err);
      } finally {
        setConvertingId(null);
      }
    },
    [updateClient]
  );

  const columns: Column<ClientRecord>[] = useMemo(
    () => [
    {
      header: "Lead / Prospect Name",
      accessorKey: "name",
      cell: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-primary-muted dark:bg-primary-muted/50 text-primary font-bold flex items-center justify-center text-xs">
            {row.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-foreground text-xs">{row.name}</p>
            <p className="text-[10px] text-muted-foreground">{row.entityType}</p>
          </div>
        </div>
      )
    },
    {
      header: "Identifiers",
      cell: (row) => (
        <div className="text-[11px] space-y-0.5">
          <p className="font-mono font-medium text-foreground">
            <span className="text-muted-foreground text-[10px] mr-1">PAN:</span>
            {row.pan ? (
              row.pan
            ) : (
              <span className="text-amber-600 dark:text-amber-400 font-sans italic text-[10px]">
                Not Provided (Optional)
              </span>
            )}
          </p>
          {row.gstin ? (
            <p className="font-mono text-muted-foreground text-[10px]">
              <span className="text-muted-foreground mr-1">GST:</span>{row.gstin}
            </p>
          ) : (
            <p className="text-muted-foreground italic text-[10px]">No GSTIN</p>
          )}
        </div>
      )
    },
    {
      header: "Scope of Work",
      cell: (row) => {
        const wt = row.workType || "ITR";
        const badgeColor =
          wt === "ITR"
            ? "bg-primary-muted text-primary border-primary/20"
            : wt === "GST"
            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
            : wt === "Tax Audit"
            ? "bg-primary-muted text-primary border-primary/20"
            : wt === "ITR + GST"
            ? "bg-primary-muted text-primary border-primary/20"
            : wt === "TDS/TCS"
            ? "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/60"
            : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60";

        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${badgeColor}`}>
            {wt}
          </span>
        );
      }
    },
    {
      header: "Contact Info",
      cell: (row) => (
        <div className="text-[11px] space-y-0.5">
          <p className="text-foreground/80 flex items-center gap-1">
            <Phone className="w-3 h-3 text-muted-foreground" />
            <span>{row.contactPhone}</span>
            <a
              href={`https://wa.me/91${row.contactPhone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              title="Open WhatsApp chat"
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 ml-1 inline-flex items-center"
            >
              <MessageSquare className="w-3 h-3" />
            </a>
          </p>
          {row.contactEmail ? (
            <p className="text-muted-foreground flex items-center gap-1">
              <Mail className="w-3 h-3 text-muted-foreground" />
              {row.contactEmail}
            </p>
          ) : (
            <p className="text-muted-foreground italic text-[10px]">No email</p>
          )}
        </div>
      )
    },
    {
      header: "Assigned Staff",
      cell: (row) => (
        <span className="text-xs text-foreground/80 font-medium">{row.assignedStaffName || "Unassigned"}</span>
      )
    },
    {
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="success"
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            isLoading={convertingId === row.id}
            onClick={() => handleConvertToActive(row)}
            className="px-2.5 py-1 text-xs whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 text-white"
            title="Convert this lead to an Active Client and generate filings"
          >
            Convert to Client
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Eye className="w-3.5 h-3.5" />}
            onClick={() => navigate(`/clients/${row.id}`)}
            className="hover:border-blue-400 hover:text-primary px-2 py-1 text-xs"
            title="View Client Details"
          >
            CRM
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Pencil className="w-3.5 h-3.5 text-primary" />}
            onClick={() => setLeadToEdit(row)}
            className="hover:border-blue-400 hover:bg-primary-muted text-primary px-2 py-1 text-xs"
            title="Edit Lead Details"
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />}
            onClick={() => setLeadToDelete(row)}
            className="hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-2 py-1 text-xs"
            title="Delete Lead"
          >
            Delete
          </Button>
        </div>
      )
    }
  ], [convertingId, handleConvertToActive, navigate]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${totalLeads} ${totalLeads === 1 ? "Lead" : "Leads"}`}
        title="Lead Pipeline"
        description="Capture prospective clients, inquiries, and service scopes; convert them to active engagements in one click."
        actions={
          <>
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate("/clients")}
              className="text-xs"
            >
              View All Clients
            </Button>
            <Button
              onClick={() => setIsAddLeadOpen(true)}
              leftIcon={<UserPlus className="w-4 h-4" />}
              className="bg-primary-muted hover:bg-primary-muted text-white"
            >
              Add Lead Client
            </Button>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-card p-4 rounded-xl border border-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Total Active Leads</span>
            <div className="w-8 h-8 rounded-lg bg-primary-muted text-primary flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{totalLeads}</span>
            <span className="text-[11px] text-primary dark:text-primary font-medium">In Pipeline</span>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Direct Tax (ITR) Leads</span>
            <div className="w-8 h-8 rounded-lg bg-primary-muted text-primary flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{itrLeads}</span>
            <span className="text-[11px] text-primary font-medium">Income Tax</span>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">GST Returns Leads</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{gstLeads}</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">GST Services</span>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">ITR + GST Packages</span>
            <div className="w-8 h-8 rounded-lg bg-primary-muted text-primary flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{comboLeads}</span>
            <span className="text-[11px] text-primary font-medium">Combined Retainers</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-2xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter leads by name, phone, PAN, or GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-muted border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>

        <select
          value={workTypeFilter}
          onChange={(e) => setWorkTypeFilter(e.target.value)}
          className="text-xs border border-border rounded-lg px-3 py-1.5 bg-card text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring font-medium"
        >
          <option value="">All Services (Work Scope)</option>
          <option value="ITR">ITR (Income Tax)</option>
          <option value="GST">GST Returns</option>
          <option value="Tax Audit">Tax Audit (44AB)</option>
          <option value="GST Registration">GST Registration</option>
          <option value="TDS/TCS">TDS/TCS</option>
          <option value="ITR + GST">ITR + GST Package</option>
        </select>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="text-xs border border-border rounded-lg px-3 py-1.5 bg-card text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Entity Types</option>
          <option value="INDIVIDUAL">Individual</option>
          <option value="PROPRIETORSHIP">Proprietorship</option>
          <option value="PARTNERSHIP">Partnership</option>
          <option value="LLP">LLP</option>
          <option value="PVT_LTD">Pvt Ltd</option>
          <option value="TRUST">Trust</option>
        </select>
      </div>

      {/* Data Table */}
      <Table
        columns={columns}
        data={leads}
        isLoading={isLoading}
        emptyText="No lead clients found. Click 'Add Lead Client' to start logging prospects."
      />

      {/* Add Lead Modal */}
      <AddLeadModal isOpen={isAddLeadOpen} onClose={() => setIsAddLeadOpen(false)} />

      {/* Edit Client Modal */}
      {leadToEdit && (
        <EditClientModal
          key={leadToEdit.id}
          isOpen={!!leadToEdit}
          onClose={() => setLeadToEdit(null)}
          client={leadToEdit}
        />
      )}

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!leadToDelete}
        onClose={() => setLeadToDelete(null)}
        client={leadToDelete}
      />
    </div>
  );
};
