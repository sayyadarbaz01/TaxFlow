import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Plus, User, Eye, Phone, Mail, Filter, Pencil, Trash2, UserPlus, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";
import { Button } from "../../components/ui/Button";
import { Table, Column } from "../../components/ui/Table";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useGetClientsQuery, useUpdateClientMutation } from "../../lib/api";
import { ClientRecord } from "@ca-saas/shared-types";
import { ClientOnboardingModal } from "./ClientOnboardingModal";
import { EditClientModal } from "./EditClientModal";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";

export const ClientListPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [entityFilter, setEntityFilter] = useState("");
  const [workTypeFilter, setWorkTypeFilter] = useState("");
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<ClientRecord | null>(null);
  const [clientToDelete, setClientToDelete] = useState<ClientRecord | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const [updateClient] = useUpdateClientMutation();

  useEffect(() => {
    const s = searchParams.get("status");
    if (s !== null) {
      setStatusFilter(s);
    }
  }, [searchParams]);

  const navigate = useNavigate();

  const handleConvertToActive = async (client: ClientRecord) => {
    try {
      setConvertingId(client.id);
      await updateClient({
        id: client.id,
        status: "ACTIVE"
      }).unwrap();
    } catch (err) {
      console.error("Failed to convert client:", err);
    } finally {
      setConvertingId(null);
    }
  };

  const { data, isLoading } = useGetClientsQuery({
    search,
    status: statusFilter,
    entityType: entityFilter,
    workType: workTypeFilter || undefined
  });

  const columns: Column<ClientRecord>[] = [
    {
      header: "Client Name",
      accessorKey: "name",
      cell: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
            {row.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-xs">{row.name}</p>
            <p className="text-[10px] text-slate-500">{row.entityType}</p>
          </div>
        </div>
      )
    },
    {
      header: "Identifiers (PAN / GSTIN)",
      cell: (row) => (
        <div className="text-[11px] space-y-0.5">
          <p className="font-mono font-medium text-slate-900">
            <span className="text-slate-400 text-[10px] mr-1">PAN:</span>{row.pan}
          </p>
          {row.gstin ? (
            <p className="font-mono text-slate-600 text-[10px]">
              <span className="text-slate-400 mr-1">GST:</span>{row.gstin}
            </p>
          ) : (
            <p className="text-slate-400 italic text-[10px]">No GSTIN</p>
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
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : wt === "GST"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : wt === "Tax Audit"
            ? "bg-purple-50 text-purple-700 border-purple-200"
            : wt === "ITR + GST"
            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
            : wt === "TDS/TCS"
            ? "bg-cyan-50 text-cyan-700 border-cyan-200"
            : "bg-amber-50 text-amber-700 border-amber-200";

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
          <p className="text-slate-700 flex items-center gap-1">
            <Phone className="w-3 h-3 text-slate-400" />
            {row.contactPhone}
          </p>
          {row.contactEmail ? (
            <p className="text-slate-500 flex items-center gap-1">
              <Mail className="w-3 h-3 text-slate-400" />
              {row.contactEmail}
            </p>
          ) : (
            <p className="text-slate-400 italic text-[10px]">No email</p>
          )}
        </div>
      )
    },
    {
      header: "Assigned Staff",
      cell: (row) => (
        <span className="text-xs text-slate-700 font-medium">{row.assignedStaffName || "Unassigned"}</span>
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
          {row.status === "LEAD" && (
            <Button
              size="sm"
              variant="success"
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              isLoading={convertingId === row.id}
              onClick={() => handleConvertToActive(row)}
              className="px-2.5 py-1 text-xs whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 text-white"
              title="Convert this lead to an Active Client and generate filings"
            >
              Convert
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Eye className="w-3.5 h-3.5" />}
            onClick={() => navigate(`/clients/${row.id}`)}
            className="hover:border-blue-400 hover:text-blue-600 px-2.5 py-1 text-xs"
          >
            View CRM
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Pencil className="w-3.5 h-3.5 text-blue-600" />}
            onClick={() => setClientToEdit(row)}
            className="hover:border-blue-400 hover:bg-blue-50 text-blue-700 px-2.5 py-1 text-xs"
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
            onClick={() => setClientToDelete(row)}
            className="hover:border-rose-300 hover:bg-rose-50 text-rose-600 px-2.5 py-1 text-xs"
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Client Management CRM</h1>
          <p className="text-xs text-slate-500 mt-1">Manage firm clients, compliance statuses, contacts, and staff assignments.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/leads")}
            leftIcon={<UserPlus className="w-4 h-4 text-purple-600" />}
            className="border-purple-200 text-purple-700 hover:bg-purple-50 text-xs"
          >
            Lead Clients Pipeline
          </Button>
          <Button onClick={() => setIsOnboardingOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Add Client
          </Button>
        </div>
      </div>

      {/* Status Segmented Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        {[
          { id: "", label: "All Clients" },
          { id: "ACTIVE", label: "Active" },
          { id: "LEAD", label: "Lead Clients" },
          { id: "ONBOARDING", label: "Onboarding" },
          { id: "INACTIVE", label: "Inactive" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={clsx(
              "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5",
              statusFilter === tab.id
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            {tab.label}
            {tab.id === "LEAD" && (
              <span className={clsx(
                "w-2 h-2 rounded-full",
                statusFilter === "LEAD" ? "bg-purple-300" : "bg-purple-500"
              )}></span>
            )}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filter clients by name, PAN, or GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={workTypeFilter}
          onChange={(e) => setWorkTypeFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="LEAD">Leads</option>
          <option value="ONBOARDING">Onboarding</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Entity Types</option>
          <option value="PVT_LTD">Pvt Ltd</option>
          <option value="PROPRIETORSHIP">Proprietorship</option>
          <option value="PARTNERSHIP">Partnership</option>
          <option value="LLP">LLP</option>
        </select>
      </div>

      {/* Data Table */}
      <Table columns={columns} data={data?.data || []} isLoading={isLoading} emptyText="No clients found matching filters." />

      {/* Onboarding Modal */}
      <ClientOnboardingModal isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} />

      {/* Edit Client Modal */}
      {clientToEdit && (
        <EditClientModal
          key={clientToEdit.id}
          isOpen={!!clientToEdit}
          onClose={() => setClientToEdit(null)}
          client={clientToEdit}
        />
      )}

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        client={clientToDelete}
      />
    </div>
  );
};
