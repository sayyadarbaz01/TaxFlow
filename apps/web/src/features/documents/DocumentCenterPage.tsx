import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Upload,
  File,
  Trash2,
  Eye,
  Download,
  Search,
  Users,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  FolderOpen,
  Filter,
  Layers,
  ChevronDown,
  ChevronRight,
  MessageSquare
} from "lucide-react";
import {
  useGetDocumentsQuery,
  useGetDocumentsGroupedQuery,
  useGetClientsQuery,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,
  useGetDocumentChecklistQuery,
  useSendWhatsAppTemplateMutation
} from "../../lib/api";
import { Table, Column } from "../../components/ui/Table";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { ClientDocumentRecord, DocType } from "@ca-saas/shared-types";

export const DocumentCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeView, setActiveView] = useState<"client" | "grouped">("client");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  // Document upload form state
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState<DocType>("PAN");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSuccessToast, setUploadSuccessToast] = useState("");
  const [uploadError, setUploadError] = useState("");

  // Delete confirmation modal
  const [docToDelete, setDocToDelete] = useState<ClientDocumentRecord | null>(null);

  // Grouped accordion expanded state
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({});

  // Fetch clients list for selector
  const { data: clientsData, isLoading: isClientsLoading } = useGetClientsQuery({
    search: clientSearch || undefined,
    limit: 50
  });

  // Set initial selected client from URL param or first client in list
  useEffect(() => {
    const urlClientId = searchParams.get("clientId");
    if (urlClientId) {
      setSelectedClientId(urlClientId);
    } else if (!selectedClientId && clientsData?.data?.length) {
      setSelectedClientId(clientsData.data[0].id);
    }
  }, [clientsData, searchParams]);

  // Find currently selected client object
  const selectedClient = clientsData?.data?.find((c: any) => c.id === selectedClientId);

  // Queries for documents
  const { data: clientDocsData, isLoading: isDocsLoading } = useGetDocumentsQuery(
    { clientId: selectedClientId || undefined },
    { skip: !selectedClientId || activeView !== "client" }
  );

  const { data: groupedData, isLoading: isGroupedLoading } = useGetDocumentsGroupedQuery(
    { search: clientSearch || undefined },
    { skip: activeView !== "grouped" }
  );

  const { data: checklistData } = useGetDocumentChecklistQuery(selectedClientId, {
    skip: !selectedClientId
  });

  const [uploadDocument, { isLoading: isUploading }] = useUploadDocumentMutation();
  const [deleteDocument, { isLoading: isDeleting }] = useDeleteDocumentMutation();
  const [sendWhatsApp] = useSendWhatsAppTemplateMutation();

  const getDocActionUrl = (id: string, action: "view" | "download") => {
    const token = localStorage.getItem("accessToken") || "";
    const rawApi = ((import.meta as any).env?.VITE_API_URL || "").trim().replace(/\/+$/, "");
    const base = rawApi ? `${rawApi}/api` : "/api";
    return `${base}/documents/${id}/${action}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
  };

  const handleSelectClient = (id: string) => {
    setSelectedClientId(id);
    setSearchParams({ clientId: id });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError("");
    setUploadSuccessToast("");

    if (!selectedClientId) {
      setUploadError("Please search and select a client first.");
      return;
    }
    if (!selectedFile) {
      setUploadError("Please choose a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("clientId", selectedClientId);
    formData.append("docType", docType);
    formData.append("documentName", docName.trim() || selectedFile.name);
    formData.append("source", "MANUAL");

    try {
      await uploadDocument(formData).unwrap();
      setSelectedFile(null);
      setDocName("");
      setUploadSuccessToast(`"${docName.trim() || selectedFile.name}" uploaded successfully for ${selectedClient?.name}!`);
      setTimeout(() => setUploadSuccessToast(""), 5000);
    } catch (err: any) {
      setUploadError(err.data?.error?.message || "Document upload failed.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    try {
      await deleteDocument(docToDelete.id).unwrap();
      setDocToDelete(null);
    } catch (err: any) {
      alert(err.data?.error?.message || "Failed to delete document.");
    }
  };

  const handleRequestWhatsApp = async (docTitle: string) => {
    if (!selectedClientId) return;
    try {
      await sendWhatsApp({
        clientId: selectedClientId,
        templateName: "doc_request_reminder",
        variables: {
          client_name: selectedClient?.name || "Client",
          doc_type: docTitle,
          module: "Compliance Verification"
        }
      }).unwrap();
      alert(`WhatsApp document request dispatched to ${selectedClient?.name} for ${docTitle}!`);
    } catch (err: any) {
      alert(err.data?.error?.message || "Failed to dispatch WhatsApp request.");
    }
  };

  const toggleGroupExpand = (clientId: string) => {
    setExpandedClients((prev) => ({ ...prev, [clientId]: !prev[clientId] }));
  };

  const columns: Column<ClientDocumentRecord>[] = [
    {
      header: "Document Name",
      cell: (row) => (
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <File className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-xs">{row.fileName}</p>
            <span className="text-[10px] text-slate-500 font-medium">Client: {row.clientName}</span>
          </div>
        </div>
      )
    },
    {
      header: "Category",
      cell: (row) => (
        <span className="font-semibold text-xs text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
          {row.docType.replace(/_/g, " ")}
        </span>
      )
    },
    {
      header: "Upload Date",
      cell: (row) => (
        <span className="text-xs text-slate-700 font-mono">
          {new Date(row.uploadedAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          })}
        </span>
      )
    },
    {
      header: "Source / Uploader",
      cell: (row) => (
        <div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            row.source === "WHATSAPP"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-slate-100 text-slate-700"
          }`}>
            {row.source}
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">{row.uploadedBy}</p>
        </div>
      )
    },
    {
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center space-x-1.5">
          {/* View in new browser tab */}
          <a
            href={getDocActionUrl(row.id, "view")}
            target="_blank"
            rel="noopener noreferrer"
            title="View Document"
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-smooth"
          >
            <Eye className="w-4 h-4" />
          </a>

          {/* Download with original filename */}
          <a
            href={getDocActionUrl(row.id, "download")}
            download
            title="Download Document"
            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-smooth"
          >
            <Download className="w-4 h-4" />
          </a>

          {/* Delete Document */}
          <button
            onClick={() => setDocToDelete(row)}
            title="Delete Document"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-smooth"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {uploadSuccessToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{uploadSuccessToast}</span>
        </div>
      )}

      {/* Page Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Client Document Vault & Checklist
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Secure, client-specific document management with row-level ownership and WhatsApp collection.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveView("client")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-smooth ${
              activeView === "client" ? "bg-white text-blue-700 shadow-xs font-bold" : "hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>By Selected Client</span>
          </button>

          <button
            onClick={() => setActiveView("grouped")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-smooth ${
              activeView === "grouped" ? "bg-white text-blue-700 shadow-xs font-bold" : "hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Grouped Overview (All Clients)</span>
          </button>
        </div>
      </div>

      {/* Step 1: Search & Select Client by Name */}
      <Card className="bg-gradient-to-r from-blue-50/50 to-slate-50 border-blue-100 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
              Step 1: Select Client / User
            </span>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Client by Name, PAN, or Phone..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full md:w-80 pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 md:max-w-md">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Active Client Profile Context:
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => handleSelectClient(e.target.value)}
              className="w-full text-xs font-semibold p-2 rounded-lg border border-blue-300 bg-white shadow-xs focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose Client --</option>
              {clientsData?.data?.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.pan}) — {c.entityType}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Client Profile Info Header */}
        {selectedClient && (
          <div className="mt-4 pt-3 border-t border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                {selectedClient.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">{selectedClient.name}</h3>
                  <span className="font-mono bg-blue-100 text-blue-800 text-[10px] font-semibold px-1.5 py-0.2 rounded">
                    {selectedClient.pan}
                  </span>
                  <span className="text-[11px] text-slate-500">({selectedClient.entityType})</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Phone: {selectedClient.contactPhone} • Email: {selectedClient.contactEmail || "None"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs bg-white"
                rightIcon={<ExternalLink className="w-3.5 h-3.5 text-slate-400" />}
                onClick={() => navigate(`/clients/${selectedClient.id}`)}
              >
                Open Full Client Profile
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* VIEW 1: By Selected Client */}
      {activeView === "client" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Upload Form & Checklist */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Document Card */}
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Upload className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Upload Document</h3>
              </div>

              {selectedClient ? (
                <p className="text-[11px] text-blue-800 bg-blue-50 p-2 rounded-lg mb-3 border border-blue-100">
                  Adding document linked strictly to: <strong>{selectedClient.name}</strong>
                </p>
              ) : (
                <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg mb-3 border border-amber-200">
                  Select a client above to enable upload.
                </p>
              )}

              {uploadError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{uploadError}</span>
                </div>
              )}

              <form onSubmit={handleUpload} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Document Name / Title
                  </label>
                  <Input
                    placeholder="e.g. HDFC Statement Q1 FY26 or Form 16"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Document Category
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="PAN">PAN Card</option>
                    <option value="BANK_STATEMENT">Bank Statement</option>
                    <option value="AADHAAR">Aadhaar Card</option>
                    <option value="EMAIL_ID">Email Confirmation</option>
                    <option value="OTHER">Other Compliance Document</option>
                  </select>
                </div>

                <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center hover:border-blue-400 transition-smooth">
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    required
                  />
                  {selectedFile && (
                    <p className="text-xs font-bold text-slate-800 mt-2 truncate">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">PDF, JPG, PNG, Excel up to 25MB</p>
                </div>

                <Button
                  type="submit"
                  className="w-full shadow-xs"
                  isLoading={isUploading}
                  disabled={!selectedClientId}
                >
                  Save & Link to Client
                </Button>
              </form>

              {/* 1-Click WhatsApp Document Request */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 mb-2">
                  1-Click WhatsApp Document Request
                </h4>
                <div className="space-y-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start text-xs"
                    leftIcon={<MessageSquare className="w-3.5 h-3.5 text-emerald-600" />}
                    onClick={() => handleRequestWhatsApp("Bank Statement")}
                  >
                    Request Bank Statement
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start text-xs"
                    leftIcon={<MessageSquare className="w-3.5 h-3.5 text-emerald-600" />}
                    onClick={() => handleRequestWhatsApp("PAN Card")}
                  >
                    Request PAN Card
                  </Button>
                </div>
              </div>
            </Card>

            {/* Checklist Card for Selected Client */}
            {checklistData && (
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900">Compliance Checklist</h3>
                  <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    {checklistData.completedCount} / {checklistData.totalRequired}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {checklistData.checklist?.map((item: any) => (
                    <div
                      key={item.docType}
                      className="p-2.5 rounded-lg border border-slate-200 flex items-center justify-between bg-slate-50/50"
                    >
                      <div className="flex items-center gap-2">
                        {item.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-800">
                          {item.docType.replace(/_/g, " ")}
                        </span>
                      </div>
                      {item.isCompleted ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Verified
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[10px] h-6 px-2 text-amber-700 hover:bg-amber-100"
                          onClick={() => handleRequestWhatsApp(item.docType)}
                        >
                          Request
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column: Documents Table for Selected Client */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Documents Linked to {selectedClient?.name || "Client"}
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {clientDocsData?.data?.length || 0} Files Stored
              </span>
            </div>

            <Table
              columns={columns}
              data={clientDocsData?.data || []}
              isLoading={isDocsLoading}
              emptyText="No documents found for this client. Use the form on the left to upload."
            />
          </div>
        </div>
      )}

      {/* VIEW 2: Grouped Overview for Admin / CA */}
      {activeView === "grouped" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Firm-wide Document Repository (Grouped by Client)
            </h3>
            <span className="text-xs text-slate-500">
              {groupedData?.totalClients || 0} Active Clients
            </span>
          </div>

          {isGroupedLoading ? (
            <div className="p-12 text-center text-xs text-slate-500 font-medium animate-pulse">
              Loading Grouped Document Repository...
            </div>
          ) : (
            <div className="space-y-3">
              {groupedData?.data?.map((group: any) => {
                const isExpanded = !!expandedClients[group.clientId];
                return (
                  <Card key={group.clientId} className="p-4 hover:border-blue-200 transition-smooth">
                    {/* Header Row */}
                    <div
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                      onClick={() => toggleGroupExpand(group.clientId)}
                    >
                      <div className="flex items-center gap-3">
                        <button className="p-1 rounded text-slate-400 hover:text-slate-600">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{group.clientName}</h4>
                            <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                              {group.pan}
                            </span>
                            <span className="text-[10px] text-slate-400">({group.entityType})</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Checklist: {group.checklistCompleted} / {group.checklistTotal} Verified • Latest:{" "}
                            {group.latestUploadDate
                              ? new Date(group.latestUploadDate).toLocaleDateString()
                              : "No files yet"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className="font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
                          {group.totalDocuments} Documents
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => {
                            handleSelectClient(group.clientId);
                            setActiveView("client");
                          }}
                        >
                          Manage Vault
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                          rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                          onClick={() => navigate(`/clients/${group.clientId}`)}
                        >
                          Profile
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Documents List */}
                    {isExpanded && (
                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                        {group.documents?.length === 0 ? (
                          <p className="text-xs text-slate-400 italic py-2">
                            No documents uploaded for this client yet.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            {group.documents.map((doc: any) => (
                              <div
                                key={doc.id}
                                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between hover:bg-white transition-smooth"
                              >
                                <div className="flex items-center gap-2 truncate pr-2">
                                  <File className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  <div className="truncate">
                                    <p className="font-bold text-slate-900 truncate">{doc.fileName}</p>
                                    <span className="text-[10px] text-slate-400">
                                      {doc.docType.replace(/_/g, " ")} •{" "}
                                      {new Date(doc.uploadedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-1 shrink-0">
                                  <a
                                    href={getDocActionUrl(doc.id, "view")}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 rounded text-slate-400 hover:text-blue-600"
                                    title="View"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </a>
                                  <a
                                    href={getDocActionUrl(doc.id, "download")}
                                    download
                                    className="p-1 rounded text-slate-400 hover:text-emerald-600"
                                    title="Download"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
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
            <p className="text-slate-700">
              Are you sure you want to permanently delete <strong>"{docToDelete.fileName}"</strong>? This will remove the file from storage and revoke compliance verification.
            </p>
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
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
