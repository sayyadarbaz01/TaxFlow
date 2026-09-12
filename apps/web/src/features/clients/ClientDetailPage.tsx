import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Building,
  Phone,
  Mail,
  FileText,
  MessageSquare,
  Plus,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Upload,
  File,
  Eye,
  Download,
  Trash2,
  AlertCircle,
  FolderOpen
} from "lucide-react";
import {
  useGetClientByIdQuery,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,
  useGetDocumentChecklistQuery
} from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Tabs } from "../../components/ui/Tabs";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Table, Column } from "../../components/ui/Table";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { DocType } from "@ca-saas/shared-types";

export const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState("overview");

  // Document upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState<DocType>("PAN");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [docToDelete, setDocToDelete] = useState<any | null>(null);

  const { data: client, isLoading, refetch } = useGetClientByIdQuery(id);
  const { data: checklistData } = useGetDocumentChecklistQuery(id || "", { skip: !id });

  const [uploadDocument, { isLoading: isUploading }] = useUploadDocumentMutation();
  const [deleteDocument, { isLoading: isDeleting }] = useDeleteDocumentMutation();

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-slate-500 font-medium animate-pulse">Loading Client 360 Record...</div>;
  }

  if (!client) {
    return <div className="p-12 text-center text-xs text-rose-600 font-medium">Client Record Not Found</div>;
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError("");

    if (!selectedFile) {
      setUploadError("Please choose a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("clientId", client.id);
    formData.append("docType", docType);
    formData.append("documentName", docName.trim() || selectedFile.name);
    formData.append("source", "MANUAL");

    try {
      await uploadDocument(formData).unwrap();
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setDocName("");
      refetch();
    } catch (err: any) {
      setUploadError(err.data?.error?.message || "Failed to upload document.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    try {
      await deleteDocument(docToDelete.id).unwrap();
      setDocToDelete(null);
      refetch();
    } catch (err: any) {
      alert(err.data?.error?.message || "Failed to delete document.");
    }
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "documents", label: "Documents Vault", badge: client.documents?.length },
    { id: "itr", label: "ITR Filings", badge: client.itrFilings?.length },
    { id: "gst", label: "GST Returns", badge: client.gstReturns?.length },
    { id: "tds", label: "TDS / TCS", badge: client.tdsTcsEntries?.length },
    { id: "billing", label: "Invoices & Fees", badge: client.invoices?.length },
    { id: "tasks", label: "Tasks", badge: client.tasks?.length }
  ];

  const getDocActionUrl = (id: string, action: "view" | "download") => {
    const token = localStorage.getItem("accessToken") || "";
    const rawApi = ((import.meta as any).env?.VITE_API_URL || "").trim().replace(/\/+$/, "");
    const base = rawApi ? `${rawApi}/api` : "/api";
    return `${base}/documents/${id}/${action}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
  };

  const docColumns: Column<any>[] = [
    {
      header: "Document Name",
      cell: (row) => (
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg">
            <File className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white text-xs">{row.fileName}</p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              Uploaded on {new Date(row.uploadedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      )
    },
    {
      header: "Category",
      cell: (row) => (
        <span className="font-semibold text-xs text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 px-2.5 py-0.5 rounded-full">
          {row.docType.replace(/_/g, " ")}
        </span>
      )
    },
    {
      header: "Uploaded By",
      accessorKey: "uploadedBy"
    },
    {
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center space-x-2">
          <a
            href={getDocActionUrl(row.id, "view")}
            target="_blank"
            rel="noopener noreferrer"
            title="View Document"
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-smooth"
          >
            <Eye className="w-4 h-4" />
          </a>
          <a
            href={getDocActionUrl(row.id, "download")}
            download
            title="Download Document"
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-smooth"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            onClick={() => setDocToDelete(row)}
            title="Delete Document"
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-smooth"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate("/clients")}
        className="flex items-center space-x-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-smooth"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Clients CRM</span>
      </button>

      {/* Client Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-lg shadow-sm shrink-0">
            {client.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{client.name}</h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                client.status === "LEAD"
                  ? "bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60"
                  : "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
              }`}>
                {client.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Entity: <span className="font-semibold text-slate-700 dark:text-slate-200">{client.entityType}</span> | PAN: <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{client.pan}</span> | GSTIN: <span className="font-mono text-slate-800 dark:text-slate-200">{client.gstin || "N/A"}</span>
            </p>
            <div className="flex items-center space-x-4 text-xs text-slate-600 dark:text-slate-400 mt-2">
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" />{client.contactPhone}</span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {client.contactEmail || <span className="text-slate-400 italic">No email provided</span>}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
            onClick={() => {
              setActiveTab("documents");
              setIsUploadModalOpen(true);
            }}
          >
            Upload Document
          </Button>
          <Button size="sm" variant="outline" leftIcon={<MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />} onClick={() => navigate("/whatsapp")}>
            WhatsApp Notice
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Compliance Snapshot</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Active ITR</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-1">{client.itrFilings?.[0]?.assessmentYear || "AY 2026-27"}</p>
                  <StatusBadge status={client.itrFilings?.[0]?.status || "NOT_STARTED"} className="mt-1" />
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Recent GST Return</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-1">{client.gstReturns?.[0]?.returnType || "GSTR-3B"}</p>
                  <StatusBadge status={client.gstReturns?.[0]?.status || "PENDING"} className="mt-1" />
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Uploaded Documents</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-1">{client.documents?.length || 0} Files</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Assigned Staff</h3>
              <div className="flex items-center space-x-3 p-3 bg-blue-50/50 dark:bg-slate-800/60 rounded-lg border border-blue-100 dark:border-slate-700/60">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  {client.assignedStaff?.name.charAt(0) || "S"}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{client.assignedStaff?.name || "Unassigned"}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{client.assignedStaff?.email || "staff@firm.com"}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: DOCUMENTS VAULT (NEW & ENHANCED) */}
      {activeTab === "documents" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Documents Linked to {client.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                All files uploaded here are securely linked specifically to this client account.
              </p>
            </div>
            <Button
              size="sm"
              leftIcon={<Upload className="w-4 h-4" />}
              onClick={() => setIsUploadModalOpen(true)}
            >
              Add New Document
            </Button>
          </div>

          {/* Checklist Bar */}
          {checklistData && (
            <Card className="bg-gradient-to-r from-blue-50/60 to-indigo-50/60 dark:from-slate-900 dark:to-blue-950/40 border-blue-200 dark:border-blue-900/60">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Document Verification Checklist</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Essential KYC & Tax files required for full statutory filing compliance.</p>
                </div>
                <span className="text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 px-2.5 py-1 rounded-full">
                  {checklistData.completedCount} / {checklistData.totalRequired} Verified
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                {checklistData.checklist?.map((item: any) => (
                  <div
                    key={item.docType}
                    className="p-2.5 rounded-lg border border-blue-200/80 dark:border-slate-750 bg-white dark:bg-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 truncate pr-1">
                      {item.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                      )}
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {item.docType.replace(/_/g, " ")}
                      </span>
                    </div>
                    {item.isCompleted ? (
                      <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                        OK
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-850">
                        Pending
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Documents Table */}
          <Table
            columns={docColumns}
            data={client.documents || []}
            emptyText="No documents have been uploaded for this client yet. Click 'Add New Document' above to upload files."
          />
        </div>
      )}

      {/* TAB 3: ITR */}
      {activeTab === "itr" && (
        <Card>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Client ITR Compliance Filings</h3>
          <div className="space-y-2">
            {client.itrFilings?.length ? (
              client.itrFilings.map((itr: any) => (
                <div key={itr.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{itr.assessmentYear} — {itr.itrFormType}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Due: {new Date(itr.dueDate).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={itr.status} />
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic py-3">No ITR filings registered for this client.</p>
            )}
          </div>
        </Card>
      )}

      {/* TAB 4: GST */}
      {activeTab === "gst" && (
        <Card>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">GST Returns & Schedules</h3>
          <div className="space-y-2">
            {client.gstReturns?.length ? (
              client.gstReturns.map((gst: any) => (
                <div key={gst.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{gst.returnType} — {gst.period}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Due: {new Date(gst.dueDate).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={gst.status} />
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic py-3">No GST return schedules registered for this client.</p>
            )}
          </div>
        </Card>
      )}

      {/* TAB 5: TDS */}
      {activeTab === "tds" && (
        <Card>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">TDS / TCS Reconciliation Records</h3>
          <div className="space-y-2">
            {client.tdsTcsEntries?.length ? (
              client.tdsTcsEntries.map((tds: any) => (
                <div key={tds.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{tds.financialYear} • Deductor TAN: {tds.deductorTan}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Amount: ₹{tds.amount?.toLocaleString("en-IN")}</p>
                  </div>
                  <StatusBadge status={tds.reconciliationStatus} />
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic py-3">No TDS/TCS entries recorded for this client.</p>
            )}
          </div>
        </Card>
      )}

      {/* TAB 6: BILLING */}
      {activeTab === "billing" && (
        <Card>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Invoices & Fee Statements</h3>
          <div className="space-y-2">
            {client.invoices?.length ? (
              client.invoices.map((inv: any) => (
                <div key={inv.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Invoice #{inv.invoiceNo} — ₹{inv.total?.toLocaleString("en-IN")}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={inv.status} />
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic py-3">No invoices generated for this client.</p>
            )}
          </div>
        </Card>
      )}

      {/* TAB 7: TASKS */}
      {activeTab === "tasks" && (
        <Card>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Associated Operational Tasks</h3>
          <div className="space-y-2">
            {client.tasks?.length ? (
              client.tasks.map((task: any) => (
                <div key={task.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{task.title}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic py-3">No active tasks for this client.</p>
            )}
          </div>
        </Card>
      )}

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsUploadModalOpen(false)}
          title={`Upload Document for ${client.name}`}
          maxWidth="md"
        >
          <form onSubmit={handleUpload} className="space-y-4 text-xs">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-lg text-blue-900 dark:text-blue-200">
              Files will be stored and strictly linked to <strong>{client.name}</strong> ({client.pan}).
            </div>

            {uploadError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-lg font-medium">
                {uploadError}
              </div>
            )}

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Document Name / Title
              </label>
              <Input
                placeholder="e.g. Bank Statement Q1 2026 or Signed Balance Sheet"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Document Category
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as any)}
                className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="PAN">PAN Card</option>
                <option value="BANK_STATEMENT">Bank Statement</option>
                <option value="AADHAAR">Aadhaar Card</option>
                <option value="EMAIL_ID">Email Confirmation</option>
                <option value="OTHER">Other Compliance Document</option>
              </select>
            </div>

            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-5 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-smooth">
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="text-xs text-slate-500 dark:text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 dark:file:bg-blue-950/50 file:text-blue-700 dark:file:text-blue-300"
                required
              />
              {selectedFile && (
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2 truncate">
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsUploadModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isUploading}>
                Upload & Link
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {docToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setDocToDelete(null)}
          title="Confirm Document Deletion"
          maxWidth="sm"
        >
          <div className="space-y-3 text-xs">
            <p className="text-slate-700 dark:text-slate-300">
              Are you sure you want to permanently delete <strong>"{docToDelete.fileName}"</strong>? This will revoke verification.
            </p>
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" onClick={() => setDocToDelete(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleConfirmDelete} isLoading={isDeleting}>
                Delete Document
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
