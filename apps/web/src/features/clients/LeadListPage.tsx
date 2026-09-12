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
          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center text-xs">
            {row.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white text-xs">{row.name}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">{row.entityType}</p>
          </div>
        </div>
      )
    },
    {
      header: "Identifiers",
      cell: (row) => (
        <div className="text-[11px] space-y-0.5">
          <p className="font-mono font-medium text-slate-800 dark:text-slate-200">
            <span className="text-slate-400 text-[10px] mr-1">PAN:</span>{row.pan}
          </p>
          {row.gstin ? (
            <p className="font-mono text-slate-600 dark:text-slate-400 text-[10px]">
              <span className="text-slate-400 mr-1">GST:</span>{row.gstin}
            </p>
          ) : (
            <p className="text-slate-400 dark:text-slate-500 italic text-[10px]">No GSTIN</p>
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
            ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60"
            : wt === "GST"
            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
            : wt === "Tax Audit"
            ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60"
            : wt === "ITR + GST"
            ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60"
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
          <p className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Phone className="w-3 h-3 text-slate-400" />
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
            <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Mail className="w-3 h-3 text-slate-400" />
              {row.contactEmail}
            </p>
          ) : (
            <p className="text-slate-400 dark:text-slate-500 italic text-[10px]">No email</p>
          )}
        </div>
      )
    },
    {
      header: "Assigned Staff",
      cell: (row) => (
        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{row.assignedStaffName || "Unassigned"}</span>
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
            className="hover:border-blue-400 hover:text-blue-600 px-2 py-1 text-xs"
            title="View Client Details"
          >
            CRM
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Pencil className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
            onClick={() => setLeadToEdit(row)}
            className="hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-2 py-1 text-xs"
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Lead Clients Pipeline</h1>
            <span className="bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800/60">
              {totalLeads} {totalLeads === 1 ? "Lead" : "Leads"}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Capture prospective clients, inquiries, service scopes, and convert them to active CA engagements with 1 click.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Add Lead Client
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Active Leads</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalLeads}</span>
            <span className="text-[11px] text-purple-700 dark:text-purple-400 font-medium">In Pipeline</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Direct Tax (ITR) Leads</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{itrLeads}</span>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Income Tax</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">GST Returns Leads</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{gstLeads}</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">GST Services</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">ITR + GST Packages</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{comboLeads}</span>
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">Combined Retainers</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filter leads by name, phone, PAN, or GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>

        <select
          value={workTypeFilter}
          onChange={(e) => setWorkTypeFilter(e.target.value)}
          className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
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
          className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
