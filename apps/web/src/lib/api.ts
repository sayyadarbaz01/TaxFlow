import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  DashboardSummaryResponse,
  TaxAuditRecord,
  CreateTaxAuditDTO,
  GstRegistrationRecord,
  CreateGstRegDTO
} from "@ca-saas/shared-types";

const getApiBaseUrl = (): string => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim() !== "") {
    return `${envUrl.trim().replace(/\/+$/, "")}/api`;
  }
  return "/api";
};

export const api = createApi({
  reducerPath: "api",
  keepUnusedDataFor: 300,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  baseQuery: fetchBaseQuery({
    baseUrl: getApiBaseUrl(),
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: [
    "Auth",
    "Clients",
    "Documents",
    "Itr",
    "Gst",
    "TaxAudit",
    "GstRegistration",
    "Tds",
    "Invoices",
    "Tasks",
    "WhatsApp",
    "Ai",
    "Admin",
    "Audit"
  ],
  endpoints: (builder) => ({
    // Auth Endpoints
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials
      }),
      invalidatesTags: ["Auth"]
    }),
    signup: builder.mutation({
      query: (credentials) => ({
        url: "/auth/signup",
        method: "POST",
        body: credentials
      }),
      invalidatesTags: ["Auth"]
    }),
    getMe: builder.query({
      query: () => "/auth/me",
      providesTags: ["Auth"]
    }),

    // Dashboard Summary
    getDashboardSummary: builder.query<DashboardSummaryResponse, void>({
      query: () => "/dashboard/summary",
      providesTags: ["Clients", "Itr", "Gst", "Invoices"]
    }),

    // Clients
    getClients: builder.query({
      query: (params) => ({ url: "/clients", params }),
      providesTags: ["Clients"]
    }),
    getClientById: builder.query({
      query: (id) => `/clients/${id}`,
      providesTags: ["Clients"]
    }),
    createClient: builder.mutation({
      query: (body) => ({ url: "/clients", method: "POST", body }),
      invalidatesTags: ["Clients", "Itr", "Gst", "Tasks"]
    }),
    updateClient: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/clients/${id}`,
        method: "PUT",
        body
      }),
      invalidatesTags: ["Clients", "Itr", "Gst", "Tasks"]
    }),
    deleteClient: builder.mutation({
      query: (id: string) => ({
        url: `/clients/${id}`,
        method: "DELETE"
      }),
      invalidatesTags: ["Clients", "Itr", "Gst", "Tasks", "Invoices"]
    }),

    // Documents
    getDocuments: builder.query({
      query: (params) => ({ url: "/documents", params }),
      providesTags: ["Documents"]
    }),
    getDocumentsGrouped: builder.query({
      query: (params) => ({ url: "/documents/grouped", params }),
      providesTags: ["Documents"]
    }),
    getDocumentChecklist: builder.query({
      query: (clientId) => `/documents/checklist/${clientId}`,
      providesTags: ["Documents"]
    }),
    uploadDocument: builder.mutation({
      query: (formData) => ({
        url: "/documents/upload",
        method: "POST",
        body: formData
      }),
      invalidatesTags: ["Documents", "Clients", "Itr"]
    }),
    deleteDocument: builder.mutation({
      query: (id: string) => ({
        url: `/documents/${id}`,
        method: "DELETE"
      }),
      invalidatesTags: ["Documents", "Clients"]
    }),

    // ITR
    getItrFilings: builder.query({
      query: (params) => ({ url: "/itr", params }),
      providesTags: ["Itr"]
    }),
    updateItrStatus: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/itr/${id}/status`,
        method: "PATCH",
        body
      }),
      invalidatesTags: ["Itr", "Clients", "Tasks", "WhatsApp"]
    }),

    // GST
    getGstReturns: builder.query({
      query: (params) => ({ url: "/gst", params }),
      providesTags: ["Gst"]
    }),
    getUpcomingGstDue: builder.query({
      query: () => "/gst/upcoming-due",
      providesTags: ["Gst"]
    }),
    markGstFiled: builder.mutation({
      query: (id) => ({
        url: `/gst/${id}/mark-filed`,
        method: "PATCH"
      }),
      invalidatesTags: ["Gst", "Clients"]
    }),

    // Tax Audit
    getTaxAudits: builder.query({
      query: (params) => ({ url: "/tax-audit", params }),
      providesTags: ["TaxAudit"]
    }),
    getTaxAuditSummary: builder.query({
      query: () => "/tax-audit/summary",
      providesTags: ["TaxAudit"]
    }),
    createTaxAudit: builder.mutation({
      query: (body) => ({ url: "/tax-audit", method: "POST", body }),
      invalidatesTags: ["TaxAudit", "Tasks"]
    }),
    updateTaxAuditStage: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/tax-audit/${id}/stage`,
        method: "PATCH",
        body
      }),
      invalidatesTags: ["TaxAudit"]
    }),
    getTaxAuditClauses: builder.query({
      query: (id) => `/tax-audit/${id}/clauses`,
      providesTags: ["TaxAudit"]
    }),
    updateTaxAuditClause: builder.mutation({
      query: ({ id, clauseNumber, ...body }) => ({
        url: `/tax-audit/${id}/clauses/${clauseNumber}`,
        method: "PATCH",
        body
      }),
      invalidatesTags: ["TaxAudit"]
    }),

    // GST Registration
    getGstRegistrations: builder.query({
      query: (params) => ({ url: "/gst-registration", params }),
      providesTags: ["GstRegistration"]
    }),
    getGstRegistrationSummary: builder.query({
      query: () => "/gst-registration/summary",
      providesTags: ["GstRegistration"]
    }),
    createGstRegistration: builder.mutation({
      query: (body) => ({ url: "/gst-registration", method: "POST", body }),
      invalidatesTags: ["GstRegistration"]
    }),
    advanceGstRegStage: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/gst-registration/${id}/stage`,
        method: "PATCH",
        body
      }),
      invalidatesTags: ["GstRegistration"]
    }),
    syncGstRegistrationToClient: builder.mutation({
      query: (id) => ({
        url: `/gst-registration/${id}/sync-client`,
        method: "POST"
      }),
      invalidatesTags: ["GstRegistration", "Clients", "Gst"]
    }),

    // TDS / TCS
    getTdsEntries: builder.query({
      query: (params) => ({ url: "/tds-tcs", params }),
      providesTags: ["Tds"]
    }),
    createTdsEntry: builder.mutation({
      query: (body) => ({ url: "/tds-tcs", method: "POST", body }),
      invalidatesTags: ["Tds", "Clients"]
    }),

    // Billing & Invoices
    getInvoices: builder.query({
      query: (params) => ({ url: "/invoices", params }),
      providesTags: ["Invoices"]
    }),
    createInvoice: builder.mutation({
      query: (body) => ({ url: "/invoices", method: "POST", body }),
      invalidatesTags: ["Invoices", "Clients"]
    }),
    markInvoicePaid: builder.mutation({
      query: ({ id, method }) => ({
        url: `/invoices/${id}/mark-paid`,
        method: "POST",
        body: { method }
      }),
      invalidatesTags: ["Invoices", "Clients"]
    }),
    getUpiLink: builder.query({
      query: (id) => `/invoices/${id}/upi-link`,
      providesTags: ["Invoices"]
    }),

    // Tasks
    getTasks: builder.query({
      query: (params) => ({ url: "/tasks", params }),
      providesTags: ["Tasks"]
    }),
    createTask: builder.mutation({
      query: (body) => ({ url: "/tasks", method: "POST", body }),
      invalidatesTags: ["Tasks"]
    }),
    updateTaskStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/tasks/${id}/status`,
        method: "PATCH",
        body: { status }
      }),
      invalidatesTags: ["Tasks"]
    }),

    // WhatsApp
    getWhatsAppMessages: builder.query({
      query: (params) => ({ url: "/whatsapp/messages", params }),
      providesTags: ["WhatsApp"]
    }),
    getWhatsAppMonthlySpend: builder.query({
      query: () => "/whatsapp/spend/monthly",
      providesTags: ["WhatsApp"]
    }),
    getWhatsAppTemplates: builder.query({
      query: () => "/whatsapp/templates",
      providesTags: ["WhatsApp"]
    }),
    sendWhatsAppTemplate: builder.mutation({
      query: (body) => ({ url: "/whatsapp/send", method: "POST", body }),
      invalidatesTags: ["WhatsApp"]
    }),

    // AI Assistant
    askAi: builder.mutation({
      query: (body) => ({ url: "/ai-assistant/query", method: "POST", body }),
      invalidatesTags: ["Ai"]
    }),

    // Admin & Audit
    getAdminUsers: builder.query({
      query: (params) => ({ url: "/admin/users", params }),
      providesTags: ["Admin"]
    }),
    getRoles: builder.query({
      query: () => "/admin/roles",
      providesTags: ["Admin"]
    }),
    updateRolePermissions: builder.mutation({
      query: ({ roleId, permissionNames }) => ({
        url: `/admin/roles/${roleId}/permissions`,
        method: "PUT",
        body: { permissionNames }
      }),
      invalidatesTags: ["Admin", "Auth"]
    }),
    registerUser: builder.mutation({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body
      }),
      invalidatesTags: ["Admin"]
    }),
    getAuditLogs: builder.query({
      query: (params) => ({ url: "/admin/audit-logs", params }),
      providesTags: ["Audit"]
    })
  })
});

export const {
  useLoginMutation,
  useSignupMutation,
  useGetMeQuery,
  useGetDashboardSummaryQuery,
  useGetClientsQuery,
  useGetClientByIdQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
  useGetDocumentsQuery,
  useGetDocumentsGroupedQuery,
  useGetDocumentChecklistQuery,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,
  useGetItrFilingsQuery,
  useUpdateItrStatusMutation,
  useGetGstReturnsQuery,
  useGetUpcomingGstDueQuery,
  useMarkGstFiledMutation,
  useGetTaxAuditsQuery,
  useGetTaxAuditSummaryQuery,
  useCreateTaxAuditMutation,
  useUpdateTaxAuditStageMutation,
  useGetTaxAuditClausesQuery,
  useUpdateTaxAuditClauseMutation,
  useGetGstRegistrationsQuery,
  useGetGstRegistrationSummaryQuery,
  useCreateGstRegistrationMutation,
  useAdvanceGstRegStageMutation,
  useSyncGstRegistrationToClientMutation,
  useGetTdsEntriesQuery,
  useCreateTdsEntryMutation,
  useGetInvoicesQuery,
  useCreateInvoiceMutation,
  useMarkInvoicePaidMutation,
  useGetUpiLinkQuery,
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskStatusMutation,
  useGetWhatsAppMessagesQuery,
  useGetWhatsAppMonthlySpendQuery,
  useGetWhatsAppTemplatesQuery,
  useSendWhatsAppTemplateMutation,
  useAskAiMutation,
  useGetAdminUsersQuery,
  useRegisterUserMutation,
  useGetRolesQuery,
  useUpdateRolePermissionsMutation,
  useGetAuditLogsQuery
} = api;
