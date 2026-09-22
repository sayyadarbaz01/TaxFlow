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
  FolderOpen,
  Briefcase,
  Layers,
  Edit2,
  Check
} from "lucide-react";
import {
  useGetClientByIdQuery,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,
  useGetDocumentChecklistQuery,
  useGetClientServicesQuery,
  useAddClientServiceMutation,
  useUpdateClientServiceMutation,
  useDeleteClientServiceMutation
} from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Tabs } from "../../components/ui/Tabs";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Table, Column } from "../../components/ui/Table";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import {
  DocType,
  ClientServiceRecord,
  ServiceType,
  ServicePaymentStatus,
  ServiceWorkStatus
} from "@ca-saas/shared-types";

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

  // Client Services state & hooks
  const { data: servicesData = [], refetch: refetchServices } = useGetClientServicesQuery(id || "", { skip: !id });
  const [addClientService, { isLoading: isAddingService }] = useAddClientServiceMutation();
  const [updateClientService, { isLoading: isUpdatingService }] = useUpdateClientServiceMutation();
  const [deleteClientService, { isLoading: isDeletingService }] = useDeleteClientServiceMutation();

  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [serviceType, setServiceType] = useState<ServiceType>("INCOME_TAX_RETURN");
  const [itrFormType, setItrFormType] = useState<string>("ITR_1");
  const [assessmentYear, setAssessmentYear] = useState<string>("AY 2026-27");
  const [gstReturnType, setGstReturnType] = useState<string>("GSTR3B");
  const [gstPeriod, setGstPeriod] = useState<string>("August 2026");
  const [gstRegType, setGstRegType] = useState<string>("REGULAR");
  const [gstTrn, setGstTrn] = useState<string>("");
  const [gstState, setGstState] = useState<string>("Maharashtra (27)");
  const [serviceFee, setServiceFee] = useState<number>(5000);
  const [servicePaymentStatus, setServicePaymentStatus] = useState<ServicePaymentStatus>("PENDING");
  const [serviceWorkStatus, setServiceWorkStatus] = useState<ServiceWorkStatus>("NOT_STARTED");
  const [serviceError, setServiceError] = useState<string>("");

  const [editingService, setEditingService] = useState<ClientServiceRecord | null>(null);
  const [editFee, setEditFee] = useState<number>(0);
  const [editPaymentStatus, setEditPaymentStatus] = useState<ServicePaymentStatus>("PENDING");
  const [editWorkStatus, setEditWorkStatus] = useState<ServiceWorkStatus>("NOT_STARTED");
  const [serviceToDelete, setServiceToDelete] = useState<ClientServiceRecord | null>(null);

  const [uploadDocument, { isLoading: isUploading }] = useUploadDocumentMutation();
  const [deleteDocument, { isLoading: isDeleting }] = useDeleteDocumentMutation();

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-muted-foreground font-medium animate-pulse">Loading Client 360 Record...</div>;
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

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    setServiceError("");
    try {
      let serviceData: Record<string, any> = {};
      if (serviceType === "INCOME_TAX_RETURN") {
        serviceData = { itrFormType, assessmentYear };
      } else if (serviceType === "GST_RETURN") {
        serviceData = { returnType: gstReturnType, period: gstPeriod };
      } else if (serviceType === "GST_REGISTRATION") {
        serviceData = { registrationType: gstRegType, trn: gstTrn || undefined, state: gstState };
      }

      await addClientService({
        clientId: client.id,
        data: {
          serviceType,
          fee: Number(serviceFee) || 0,
          paymentStatus: servicePaymentStatus,
          workStatus: serviceWorkStatus,
          serviceData
        }
      }).unwrap();

      setIsAddServiceModalOpen(false);
      refetchServices();
    } catch (err: any) {
      setServiceError(err.data?.error?.message || "Failed to add service.");
    }
  };

  const handleOpenEditService = (svc: ClientServiceRecord) => {
    setEditingService(svc);
    setEditFee(svc.fee);
    setEditPaymentStatus(svc.paymentStatus);
    setEditWorkStatus(svc.workStatus);
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !editingService) return;
    try {
      await updateClientService({
        clientId: client.id,
        serviceId: editingService.id,
        data: {
          fee: Number(editFee) || 0,
          paymentStatus: editPaymentStatus,
          workStatus: editWorkStatus
        }
      }).unwrap();
      setEditingService(null);
      refetchServices();
    } catch (err: any) {
      alert(err.data?.error?.message || "Failed to update service.");
    }
  };

  const handleDeleteService = async () => {
    if (!client || !serviceToDelete) return;
    try {
      await deleteClientService({
        clientId: client.id,
        serviceId: serviceToDelete.id
      }).unwrap();
      setServiceToDelete(null);
      refetchServices();
    } catch (err: any) {
      alert(err.data?.error?.message || "Failed to delete service.");
    }
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "services", label: "Services & Work Items", badge: servicesData.length },
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
          <div className="p-2 bg-primary-muted text-primary rounded-lg">
            <File className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-foreground text-xs">{row.fileName}</p>
            <span className="text-[10px] text-muted-foreground font-mono">
              Uploaded on {new Date(row.uploadedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      )
    },
    {
      header: "Category",
      cell: (row) => (
        <span className="font-semibold text-xs text-blue-800 dark:text-blue-300 bg-primary-muted border border-primary/20 px-2.5 py-0.5 rounded-full">
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
            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary-muted transition-smooth"
          >
            <Eye className="w-4 h-4" />
          </a>
          <a
            href={getDocActionUrl(row.id, "download")}
            download
            title="Download Document"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-smooth"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            onClick={() => setDocToDelete(row)}
            title="Delete Document"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-smooth"
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
        className="flex items-center space-x-2 text-xs font-semibold text-muted-foreground hover:text-foreground dark:hover:text-white transition-smooth"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Clients CRM</span>
      </button>

      {/* Client Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-card border border-border rounded-xl shadow-xs">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-primary text-white font-bold flex items-center justify-center text-lg shadow-sm shrink-0">
            {client.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-foreground tracking-tight">{client.name}</h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                client.status === "LEAD"
                  ? "bg-primary-muted dark:bg-primary-muted/50 text-primary dark:text-primary border border-primary/20"
                  : "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
              }`}>
                {client.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Entity: <span className="font-semibold text-slate-700 dark:text-slate-200">{client.entityType}</span> | PAN: <span className="font-mono font-semibold text-foreground">{client.pan}</span> | GSTIN: <span className="font-mono text-foreground">{client.gstin || "N/A"}</span>
            </p>
            <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-muted-foreground" />{client.contactPhone}</span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                {client.contactEmail || <span className="text-muted-foreground italic">No email provided</span>}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Upload className="w-4 h-4 text-primary" />}
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
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground">Active Engagements & Services</h3>
                <Button size="sm" variant="outline" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setIsAddServiceModalOpen(true)}>
                  Add Service
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-4">
                <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-900/60">
                  <span className="text-primary font-medium">Independent Services</span>
                  <p className="font-bold text-foreground text-base mt-1">{servicesData.length} Active</p>
                </div>
                <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-900/60">
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">Total Agreed Fees</span>
                  <p className="font-bold text-foreground text-base mt-1">
                    ₹{servicesData.reduce((acc, s) => acc + (s.fee || 0), 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="p-3 bg-primary-muted/60 dark:bg-primary-muted/40 rounded-lg border border-primary/20 dark:border-primary/20">
                  <span className="text-primary dark:text-primary font-medium">Completed Work</span>
                  <p className="font-bold text-foreground text-base mt-1">
                    {servicesData.filter(s => s.workStatus === "COMPLETED").length} / {servicesData.length || 1}
                  </p>
                </div>
              </div>
              {servicesData.length > 0 ? (
                <div className="space-y-2">
                  {servicesData.slice(0, 3).map((svc) => (
                    <div key={svc.id} className="p-2.5 rounded-lg border border-border bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          svc.serviceType === "INCOME_TAX_RETURN" ? "bg-primary-muted text-blue-800 dark:bg-blue-950 dark:text-blue-300" :
                          svc.serviceType === "GST_RETURN" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" :
                          "bg-primary-muted text-primary dark:bg-primary-muted dark:text-primary"
                        }`}>
                          {svc.serviceType === "INCOME_TAX_RETURN" ? "ITR" : svc.serviceType === "GST_RETURN" ? "GST" : "GST REG"}
                        </span>
                        <span className="font-semibold text-foreground">{svc.serviceName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-foreground">₹{svc.fee.toLocaleString("en-IN")}</span>
                        <StatusBadge status={svc.workStatus} />
                      </div>
                    </div>
                  ))}
                  {servicesData.length > 3 && (
                    <button onClick={() => setActiveTab("services")} className="text-xs text-primary font-medium hover:underline pt-1">
                      View all {servicesData.length} client services →
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic py-2">No independent client services registered yet. Click 'Add Service' to attach ITR, GST Return, or GST Registration.</p>
              )}
            </Card>

            <Card>
              <h3 className="text-sm font-bold text-foreground mb-3">Statutory Snapshot</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-muted/60 rounded-lg border border-border/60">
                  <span className="text-muted-foreground font-medium">Active ITR</span>
                  <p className="font-bold text-foreground mt-1">{client.itrFilings?.[0]?.assessmentYear || "AY 2026-27"}</p>
                  <StatusBadge status={client.itrFilings?.[0]?.status || "NOT_STARTED"} className="mt-1" />
                </div>
                <div className="p-3 bg-muted/60 rounded-lg border border-border/60">
                  <span className="text-muted-foreground font-medium">Recent GST Return</span>
                  <p className="font-bold text-foreground mt-1">{client.gstReturns?.[0]?.returnType || "GSTR-3B"}</p>
                  <StatusBadge status={client.gstReturns?.[0]?.status || "PENDING"} className="mt-1" />
                </div>
                <div className="p-3 bg-muted/60 rounded-lg border border-border/60">
                  <span className="text-muted-foreground font-medium">Uploaded Documents</span>
                  <p className="font-bold text-foreground mt-1">{client.documents?.length || 0} Files</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Assigned Staff</h3>
              <div className="flex items-center space-x-3 p-3 bg-blue-50/50 dark:bg-slate-800/60 rounded-lg border border-blue-100 dark:border-border/60">
                <div className="w-8 h-8 rounded-full bg-primary text-white font-bold flex items-center justify-center text-xs">
                  {client.assignedStaff?.name.charAt(0) || "S"}
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{client.assignedStaff?.name || "Unassigned"}</p>
                  <p className="text-[10px] text-muted-foreground">{client.assignedStaff?.email || "staff@firm.com"}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB: SERVICES & WORK ITEMS (MULTIPLE INDEPENDENT SERVICES) */}
      {activeTab === "services" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                Multiple Client Services & Engagements
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Each service (Income Tax Return, GST Return, GST Registration) has independent fees, payment status, and work status.
              </p>
            </div>
            <Button
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddServiceModalOpen(true)}
            >
              Add Service
            </Button>
          </div>

          {/* Metrics summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <Card className="p-4 bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60">
              <span className="text-muted-foreground font-medium">Total Engagements</span>
              <p className="text-lg font-bold text-foreground mt-1">{servicesData.length} Services</p>
            </Card>
            <Card className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60">
              <span className="text-muted-foreground font-medium">Total Agreed Fees</span>
              <p className="text-lg font-bold text-foreground mt-1">
                ₹{servicesData.reduce((sum, s) => sum + (s.fee || 0), 0).toLocaleString("en-IN")}
              </p>
            </Card>
            <Card className="p-4 bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60">
              <span className="text-muted-foreground font-medium">Pending Payments</span>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-400 mt-1">
                {servicesData.filter(s => s.paymentStatus === "PENDING").length} Services
              </p>
            </Card>
            <Card className="p-4 bg-primary-muted/50 dark:bg-primary-muted/30 border-primary/20 dark:border-primary/20">
              <span className="text-muted-foreground font-medium">In Progress Work</span>
              <p className="text-lg font-bold text-primary dark:text-primary mt-1">
                {servicesData.filter(s => s.workStatus === "IN_PROGRESS").length} Active
              </p>
            </Card>
          </div>

          {/* Services List Table */}
          <div className="space-y-3">
            {servicesData.length > 0 ? (
              servicesData.map((service) => (
                <div
                  key={service.id}
                  className="p-4 rounded-xl border border-border bg-card shadow-2xs hover:border-border transition-smooth"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Service Type & Details */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            service.serviceType === "INCOME_TAX_RETURN"
                              ? "bg-primary-muted text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-primary/20"
                              : service.serviceType === "GST_RETURN"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              : "bg-primary-muted text-primary dark:bg-primary-muted/70 dark:text-primary border border-primary/20"
                          }`}
                        >
                          {service.serviceType === "INCOME_TAX_RETURN"
                            ? "Income Tax Return"
                            : service.serviceType === "GST_RETURN"
                            ? "GST Return"
                            : "GST Registration"}
                        </span>
                        <h4 className="text-xs font-bold text-foreground">{service.serviceName}</h4>
                      </div>

                      {/* Service specific metadata */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        {service.serviceType === "INCOME_TAX_RETURN" && (
                          <>
                            <span className="font-semibold text-primary bg-primary-muted px-2 py-0.5 rounded border border-primary/20">
                              Form: {service.serviceData?.itrFormType?.replace("_", "-") || "ITR-1"}
                            </span>
                            <span>Assessment Year: <strong className="text-foreground">{service.serviceData?.assessmentYear || "AY 2026-27"}</strong></span>
                            {service.serviceData?.acknowledgementNo && (
                              <span>Ack: <strong className="font-mono text-foreground">{service.serviceData.acknowledgementNo}</strong></span>
                            )}
                          </>
                        )}
                        {service.serviceType === "GST_RETURN" && (
                          <>
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                              Return: {service.serviceData?.returnType || "GSTR3B"}
                            </span>
                            <span>Period: <strong className="text-foreground">{service.serviceData?.period || "Current"}</strong></span>
                          </>
                        )}
                        {service.serviceType === "GST_REGISTRATION" && (
                          <>
                            <span className="font-semibold text-primary dark:text-primary bg-primary-muted px-2 py-0.5 rounded border border-primary/20">
                              Type: {service.serviceData?.registrationType || "Regular"}
                            </span>
                            {service.serviceData?.trn && (
                              <span>TRN: <strong className="font-mono text-foreground">{service.serviceData.trn}</strong></span>
                            )}
                            {service.serviceData?.state && (
                              <span>State: <strong className="text-foreground">{service.serviceData.state}</strong></span>
                            )}
                          </>
                        )}
                        <span className="text-muted-foreground">• Added on {new Date(service.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Right: Independent Fee, Payment Status, Work Status, Actions */}
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Service Fee</span>
                        <span className="font-mono font-bold text-sm text-foreground">
                          ₹{service.fee?.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-muted-foreground block">Payment Status</span>
                        <span
                          className={`inline-block font-semibold text-[11px] px-2 py-0.5 rounded border ${
                            service.paymentStatus === "PAID"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                              : service.paymentStatus === "PARTIAL"
                              ? "bg-blue-50 text-primary border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                              : service.paymentStatus === "WAIVED"
                              ? "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-muted-foreground dark:border-border"
                              : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                          }`}
                        >
                          {service.paymentStatus}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-muted-foreground block">Work Status</span>
                        <StatusBadge status={service.workStatus} />
                      </div>

                      <div className="flex items-center gap-1.5 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEditService(service)}
                          className="h-8 px-2.5 text-xs"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setServiceToDelete(service)}
                          className="h-8 px-2 text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center rounded-xl border border-dashed border-border bg-muted/30">
                <Briefcase className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <h4 className="text-sm font-bold text-foreground/80">No Services Added Yet</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Attach independent services like Income Tax Return (ITR-1 to 7), GST Return, or GST Registration for this client.
                </p>
                <Button size="sm" className="mt-4" onClick={() => setIsAddServiceModalOpen(true)}>
                  Add First Service
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DOCUMENTS VAULT (NEW & ENHANCED) */}
      {activeTab === "documents" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Documents Linked to {client.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
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
            <Card className="bg-primary-muted/30 border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-xs font-bold text-foreground">Document Verification Checklist</h4>
                  <p className="text-[11px] text-muted-foreground">Essential KYC & Tax files required for full statutory filing compliance.</p>
                </div>
                <span className="text-xs font-bold bg-primary-muted dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 px-2.5 py-1 rounded-full">
                  {checklistData.completedCount} / {checklistData.totalRequired} Verified
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                {checklistData.checklist?.map((item: any) => (
                  <div
                    key={item.docType}
                    className="p-2.5 rounded-lg border border-blue-200/80 dark:border-slate-750 bg-card flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 truncate pr-1">
                      {item.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                      )}
                      <span className="font-semibold text-foreground truncate">
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
          <h3 className="text-sm font-bold text-foreground mb-4">Client ITR Compliance Filings</h3>
          <div className="space-y-2">
            {client.itrFilings?.length ? (
              client.itrFilings.map((itr: any) => (
                <div key={itr.id} className="p-3 rounded-lg border border-border bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{itr.assessmentYear} — {itr.itrFormType}</h4>
                    <p className="text-[11px] text-muted-foreground">Due: {new Date(itr.dueDate).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={itr.status} />
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic py-3">No ITR filings registered for this client.</p>
            )}
          </div>
        </Card>
      )}

      {/* TAB 4: GST */}
      {activeTab === "gst" && (
        <Card>
          <h3 className="text-sm font-bold text-foreground mb-4">GST Returns & Schedules</h3>
          <div className="space-y-2">
            {client.gstReturns?.length ? (
              client.gstReturns.map((gst: any) => (
                <div key={gst.id} className="p-3 rounded-lg border border-border bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{gst.returnType} — {gst.period}</h4>
                    <p className="text-[11px] text-muted-foreground">Due: {new Date(gst.dueDate).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={gst.status} />
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic py-3">No GST return schedules registered for this client.</p>
            )}
          </div>
        </Card>
      )}

      {/* TAB 5: TDS */}
      {activeTab === "tds" && (
        <Card>
          <h3 className="text-sm font-bold text-foreground mb-4">TDS / TCS Reconciliation Records</h3>
          <div className="space-y-2">
            {client.tdsTcsEntries?.length ? (
              client.tdsTcsEntries.map((tds: any) => (
                <div key={tds.id} className="p-3 rounded-lg border border-border bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{tds.financialYear} • Deductor TAN: {tds.deductorTan}</h4>
                    <p className="text-[11px] text-muted-foreground">Amount: ₹{tds.amount?.toLocaleString("en-IN")}</p>
                  </div>
                  <StatusBadge status={tds.reconciliationStatus} />
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic py-3">No TDS/TCS entries recorded for this client.</p>
            )}
          </div>
        </Card>
      )}

      {/* TAB 6: BILLING */}
      {activeTab === "billing" && (
        <Card>
          <h3 className="text-sm font-bold text-foreground mb-4">Invoices & Fee Statements</h3>
          <div className="space-y-2">
            {client.invoices?.length ? (
              client.invoices.map((inv: any) => (
                <div key={inv.id} className="p-3 rounded-lg border border-border bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Invoice #{inv.invoiceNo} — ₹{inv.total?.toLocaleString("en-IN")}</h4>
                    <p className="text-[11px] text-muted-foreground">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={inv.status} />
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic py-3">No invoices generated for this client.</p>
            )}
          </div>
        </Card>
      )}

      {/* TAB 7: TASKS */}
      {activeTab === "tasks" && (
        <Card>
          <h3 className="text-sm font-bold text-foreground mb-4">Associated Operational Tasks</h3>
          <div className="space-y-2">
            {client.tasks?.length ? (
              client.tasks.map((task: any) => (
                <div key={task.id} className="p-3 rounded-lg border border-border bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{task.title}</h4>
                    <p className="text-[11px] text-muted-foreground">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic py-3">No active tasks for this client.</p>
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
            <div className="p-2.5 bg-primary-muted border border-primary/20 rounded-lg text-foreground">
              Files will be stored and strictly linked to <strong>{client.name}</strong> ({client.pan}).
            </div>

            {uploadError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-lg font-medium">
                {uploadError}
              </div>
            )}

            <div>
              <label className="block font-medium text-foreground/80 mb-1">
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
              <label className="block font-medium text-foreground/80 mb-1">
                Document Category
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as any)}
                className="w-full border border-border rounded-lg p-2 bg-card text-foreground"
              >
                <option value="PAN">PAN Card</option>
                <option value="BANK_STATEMENT">Bank Statement</option>
                <option value="AADHAAR">Aadhaar Card</option>
                <option value="EMAIL_ID">Email Confirmation</option>
                <option value="OTHER">Other Compliance Document</option>
              </select>
            </div>

            <div className="border-2 border-dashed border-border rounded-xl p-5 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-smooth">
              <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-1.5" />
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="text-xs text-muted-foreground file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 dark:file:bg-blue-950/50 file:text-primary dark:file:text-blue-300"
                required
              />
              {selectedFile && (
                <p className="text-xs font-bold text-foreground mt-2 truncate">
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-border">
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

      {/* Delete Confirmation Modal for Documents */}
      {docToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setDocToDelete(null)}
          title="Confirm Document Deletion"
          maxWidth="sm"
        >
          <div className="space-y-3 text-xs">
            <p className="text-foreground/80">
              Are you sure you want to permanently delete <strong>"{docToDelete.fileName}"</strong>? This will revoke verification.
            </p>
            <div className="flex justify-end space-x-2 pt-2 border-t border-border">
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

      {/* Add Service Modal */}
      {isAddServiceModalOpen && (
        <Modal
          isOpen={isAddServiceModalOpen}
          onClose={() => setIsAddServiceModalOpen(false)}
          title="Add Client Service / Work Item"
          maxWidth="md"
        >
          <form onSubmit={handleAddService} className="space-y-4 text-xs">
            {serviceError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-lg flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{serviceError}</span>
              </div>
            )}

            {/* Service Type Selection */}
            <Select
              label="Select Service Type"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as ServiceType)}
              options={[
                { value: "INCOME_TAX_RETURN", label: "Income Tax Return (ITR)" },
                { value: "GST_RETURN", label: "GST Return Filing (GSTR-1 / 3B / 9)" },
                { value: "GST_REGISTRATION", label: "GST Registration & Setup" }
              ]}
            />

            {/* Income Tax Return Specific Options */}
            {serviceType === "INCOME_TAX_RETURN" && (
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-3">
                <h4 className="font-bold text-foreground text-xs">ITR Configuration</h4>
                <Select
                  label="Select ITR Form"
                  value={itrFormType}
                  onChange={(e) => setItrFormType(e.target.value)}
                  options={[
                    { value: "ITR_1", label: "ITR-1 (Sahaj - Salary / 1 House Property)" },
                    { value: "ITR_2", label: "ITR-2 (Capital Gains / Multiple Properties / Foreign Assets)" },
                    { value: "ITR_3", label: "ITR-3 (Business & Professional Profits - Proprietary)" },
                    { value: "ITR_4", label: "ITR-4 (Sugam - Presumptive Scheme 44AD/44ADA/44AE)" },
                    { value: "ITR_5", label: "ITR-5 (LLP, Association of Persons, BOI)" },
                    { value: "ITR_6", label: "ITR-6 (Companies other than claiming exemption under Sec 11)" },
                    { value: "ITR_7", label: "ITR-7 (Trusts, Political Parties, Colleges, Sec 139 Entities)" }
                  ]}
                />
                <Select
                  label="Assessment Year"
                  value={assessmentYear}
                  onChange={(e) => setAssessmentYear(e.target.value)}
                  options={[
                    { value: "AY 2026-27", label: "AY 2026-27 (Current Assessment Year)" },
                    { value: "AY 2025-26", label: "AY 2025-26 (Prior Assessment Year)" }
                  ]}
                />
              </div>
            )}

            {/* GST Return Specific Options */}
            {serviceType === "GST_RETURN" && (
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-xl space-y-3">
                <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-xs">GST Return Configuration</h4>
                <Select
                  label="GST Return Type"
                  value={gstReturnType}
                  onChange={(e) => setGstReturnType(e.target.value)}
                  options={[
                    { value: "GSTR3B", label: "GSTR-3B (Monthly Summary Return)" },
                    { value: "GSTR1", label: "GSTR-1 (Outward Supplies Statement)" },
                    { value: "GSTR9", label: "GSTR-9 (Annual Return)" }
                  ]}
                />
                <Input
                  label="Filing Period / Month"
                  placeholder="e.g. August 2026 or Q2 2026"
                  value={gstPeriod}
                  onChange={(e) => setGstPeriod(e.target.value)}
                />
              </div>
            )}

            {/* GST Registration Specific Options */}
            {serviceType === "GST_REGISTRATION" && (
              <div className="p-3 bg-primary-muted/50 dark:bg-primary-muted/30 border border-primary/20 dark:border-primary/20 rounded-xl space-y-3">
                <h4 className="font-bold text-primary dark:text-primary text-xs">GST Registration Configuration</h4>
                <Select
                  label="Registration Category"
                  value={gstRegType}
                  onChange={(e) => setGstRegType(e.target.value)}
                  options={[
                    { value: "REGULAR", label: "Regular Taxpayer" },
                    { value: "COMPOSITION", label: "Composition Scheme" },
                    { value: "ISD", label: "Input Service Distributor (ISD)" },
                    { value: "NON_RESIDENT", label: "Non-Resident Taxable Entity" }
                  ]}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="State / Circle"
                    value={gstState}
                    onChange={(e) => setGstState(e.target.value)}
                  />
                  <Input
                    label="TRN Number (Optional)"
                    placeholder="e.g. TRN2609..."
                    value={gstTrn}
                    onChange={(e) => setGstTrn(e.target.value.toUpperCase())}
                  />
                </div>
              </div>
            )}

            {/* Common Independent Fee, Payment Status & Work Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Agreed Fee (₹)"
                type="number"
                min="0"
                value={serviceFee}
                onChange={(e) => setServiceFee(Number(e.target.value))}
                required
              />

              <Select
                label="Payment Status"
                value={servicePaymentStatus}
                onChange={(e) => setServicePaymentStatus(e.target.value as ServicePaymentStatus)}
                options={[
                  { value: "PENDING", label: "Pending" },
                  { value: "PAID", label: "Paid" },
                  { value: "PARTIAL", label: "Partial" },
                  { value: "WAIVED", label: "Waived" }
                ]}
              />

              <Select
                label="Work Status"
                value={serviceWorkStatus}
                onChange={(e) => setServiceWorkStatus(e.target.value as ServiceWorkStatus)}
                options={[
                  { value: "NOT_STARTED", label: "Not Started" },
                  { value: "IN_PROGRESS", label: "In Progress" },
                  { value: "COMPLETED", label: "Completed" },
                  { value: "ON_HOLD", label: "On Hold" }
                ]}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsAddServiceModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isAddingService} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add Independent Service
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Service Modal */}
      {editingService && (
        <Modal
          isOpen={true}
          onClose={() => setEditingService(null)}
          title={`Edit Service: ${editingService.serviceName}`}
          maxWidth="sm"
        >
          <form onSubmit={handleUpdateService} className="space-y-4 text-xs">
            <Input
              label="Agreed Fee (₹)"
              type="number"
              min="0"
              value={editFee}
              onChange={(e) => setEditFee(Number(e.target.value))}
              required
            />

            <Select
              label="Payment Status"
              value={editPaymentStatus}
              onChange={(e) => setEditPaymentStatus(e.target.value as ServicePaymentStatus)}
              options={[
                { value: "PENDING", label: "Pending" },
                { value: "PAID", label: "Paid" },
                { value: "PARTIAL", label: "Partial" },
                { value: "WAIVED", label: "Waived" }
              ]}
            />

            <Select
              label="Work Status"
              value={editWorkStatus}
              onChange={(e) => setEditWorkStatus(e.target.value as ServiceWorkStatus)}
              options={[
                { value: "NOT_STARTED", label: "Not Started" },
                { value: "IN_PROGRESS", label: "In Progress" },
                { value: "COMPLETED", label: "Completed" },
                { value: "ON_HOLD", label: "On Hold" }
              ]}
            />

            <div className="flex justify-end space-x-2 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setEditingService(null)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isUpdatingService}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Service Confirmation Modal */}
      {serviceToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setServiceToDelete(null)}
          title="Delete Client Service"
          maxWidth="sm"
        >
          <div className="space-y-3 text-xs">
            <p className="text-foreground/80">
              Are you sure you want to remove <strong>"{serviceToDelete.serviceName}"</strong>? This will remove this work item without affecting other services for this client.
            </p>
            <div className="flex justify-end space-x-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setServiceToDelete(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteService} isLoading={isDeletingService}>
                Delete Service
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

