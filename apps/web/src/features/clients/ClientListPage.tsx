import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Plus, User, Eye, Phone, Mail, Filter, Pencil, Trash2, UserPlus, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";
import { Button } from "../../components/ui/Button";
import { Table, Column } from "../../components/ui/Table";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { PageHeader } from "../../components/ui/PageHeader";
import { useGetClientsQuery, useUpdateClientMutation } from "../../lib/api";
import { ClientRecord } from "@ca-saas/shared-types";
import { useDebounce } from "../../lib/useDebounce";
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

  const handleConvertToActive = useCallback(
    async (client: ClientRecord) => {
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
    },
    [updateClient]
  );

  const debouncedSearch = useDebounce(search, 250);

  const { data, isLoading } = useGetClientsQuery({
    search: debouncedSearch,
    status: statusFilter,
    entityType: entityFilter,
    workType: workTypeFilter || undefined
  });

  const columns: Column<ClientRecord>[] = useMemo(
    () => [
    {
      header: "Client Name",
      accessorKey: "name",
      cell: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-primary-muted text-primary font-bold flex items-center justify-center text-xs">
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
      header: "Identifiers (PAN / GSTIN)",
      cell: (row) => (
        <div className="text-[11px] space-y-0.5">
          <p className="font-mono font-medium text-foreground">
            <span className="text-muted-foreground text-[10px] mr-1">PAN:</span>
            {row.pan ? row.pan : <span className="text-amber-600 font-sans italic text-[10px]">Not Provided</span>}
          </p>
          {row.gstin ? (
            <p className="font-mono text-slate-600 text-[10px]">
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
            ? "bg-blue-50 text-primary border-blue-200"
            : wt === "GST"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : wt === "Tax Audit"
            ? "bg-primary-muted text-primary border-primary/20"
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
            <Phone className="w-3 h-3 text-muted-foreground" />
            {row.contactPhone}
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
            className="hover:border-blue-400 hover:text-primary px-2.5 py-1 text-xs"
          >
            View CRM
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Pencil className="w-3.5 h-3.5 text-primary" />}
            onClick={() => setClientToEdit(row)}
            className="hover:border-blue-400 hover:bg-blue-50 text-primary px-2.5 py-1 text-xs"
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
  ], [convertingId, handleConvertToActive, navigate]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Manage firm clients, compliance statuses, contacts, and staff assignments."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => navigate("/leads")}
              leftIcon={<UserPlus className="w-4 h-4 text-primary" />}
              className="border-primary/20 text-primary hover:bg-primary-muted text-xs"
            >
              Lead Pipeline
            </Button>
            <Button onClick={() => setIsOnboardingOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Add Client
            </Button>
          </>
        }
      />

      {/* Status Segmented Tabs */}
      <div className="flex items-center space-x-2 border-b border-border pb-2 overflow-x-auto">
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
              "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap",
              statusFilter === tab.id
                ? "bg-slate-900 dark:bg-primary text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-muted"
            )}
          >
            {tab.label}
            {tab.id === "LEAD" && (
              <span className={clsx(
                "w-2 h-2 rounded-full",
                statusFilter === "LEAD" ? "bg-primary-muted" : "bg-primary-muted"
              )}></span>
            )}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-2xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter clients by name, PAN, or GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-card border border-border text-foreground placeholder:text-muted-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <select
          value={workTypeFilter}
          onChange={(e) => setWorkTypeFilter(e.target.value)}
          className="text-xs border border-border rounded-lg px-3 py-1.5 bg-card text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-ring font-medium"
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
          className="text-xs border border-border rounded-lg px-3 py-1.5 bg-card text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-ring font-medium"
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
          className="text-xs border border-border rounded-lg px-3 py-1.5 bg-card text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-ring font-medium"
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
