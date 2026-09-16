import { z } from "zod";

// Roles
export type SystemRole = "SuperAdmin" | "Admin" | "Client" | "Staff";

export const ROLES: SystemRole[] = ["SuperAdmin", "Admin", "Client", "Staff"];

// Auth Interfaces & Schemas
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});
export type LoginDTO = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  roleName: z.enum(["SuperAdmin", "Admin"])
});
export type RegisterDTO = z.infer<typeof RegisterSchema>;

export const SignupSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Valid email address required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firmName: z.string().optional()
});
export type SignupDTO = z.infer<typeof SignupSchema>;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: SystemRole;
  permissions?: string[];
  assignedStaffId?: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

// Client Schema & Interfaces
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const EntityTypeEnum = z.enum([
  "INDIVIDUAL",
  "PROPRIETORSHIP",
  "PARTNERSHIP",
  "LLP",
  "PVT_LTD",
  "PUBLIC_LTD",
  "TRUST",
  "OTHER"
]);
export type EntityType = z.infer<typeof EntityTypeEnum>;

export const ClientWorkTypeEnum = z.enum([
  "ITR",
  "GST",
  "Tax Audit",
  "GST Registration",
  "TDS/TCS",
  "ITR + GST"
]);
export type ClientWorkType = z.infer<typeof ClientWorkTypeEnum>;

export const ClientSchema = z.object({
  name: z.string().min(2, "Client name is required"),
  pan: z
    .string()
    .trim()
    .toUpperCase()
    .refine((val) => !val || PAN_REGEX.test(val), { message: "Invalid PAN format (e.g. ABCDE1234F)" })
    .optional()
    .or(z.literal(""))
    .nullable(),
  gstin: z.string().regex(GSTIN_REGEX, "Invalid GSTIN format").optional().or(z.literal("")),
  entityType: EntityTypeEnum,
  contactPhone: z.string().min(10, "Valid phone number required"),
  contactEmail: z.string().email("Valid email required").optional().or(z.literal("")),
  workType: ClientWorkTypeEnum.optional().default("ITR"),
  assignedStaffId: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ONBOARDING", "LEAD"]).default("ACTIVE")
});
export type ClientDTO = z.infer<typeof ClientSchema>;

export interface ClientRecord {
  id: string;
  name: string;
  pan?: string | null;
  gstin?: string | null;
  entityType: EntityType;
  contactPhone: string;
  contactEmail?: string | null;
  workType?: ClientWorkType | string | null;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  status: "ACTIVE" | "INACTIVE" | "ONBOARDING" | "LEAD";
  complianceRisk?: "LOW" | "MEDIUM" | "HIGH";
  services?: ClientServiceRecord[];
  createdAt: string;
  updatedAt: string;
}

// Document Management
export const DocTypeEnum = z.enum(["BANK_STATEMENT", "PAN", "AADHAAR", "EMAIL_ID", "OTHER"]);
export type DocType = z.infer<typeof DocTypeEnum>;

export const DocSourceEnum = z.enum(["MANUAL", "WHATSAPP"]);
export type DocSource = z.infer<typeof DocSourceEnum>;

export interface ClientDocumentRecord {
  id: string;
  clientId: string;
  clientName?: string;
  docType: DocType;
  fileUrl: string;
  fileName: string;
  uploadedBy: string;
  source: DocSource;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  uploadedAt: string;
}

// ITR Compliance
export const ItrFormTypeEnum = z.enum(["ITR_1", "ITR_2", "ITR_3", "ITR_4", "ITR_5", "ITR_6", "ITR_7"]);
export type ItrFormType = z.infer<typeof ItrFormTypeEnum>;

export const ItrStatusEnum = z.enum([
  "NOT_STARTED",
  "DOCUMENTS_PENDING",
  "UNDER_PREPARATION",
  "FILED",
  "VERIFIED",
  "PROCESSED",
  "REFUND_ISSUED"
]);
export type ItrStatus = z.infer<typeof ItrStatusEnum>;

export interface ItrFilingRecord {
  id: string;
  clientId: string;
  clientName?: string;
  workType?: string | null;
  assessmentYear: string;
  itrFormType: ItrFormType;
  dueDate: string;
  status: ItrStatus;
  filedAt?: string | null;
  acknowledgementNo?: string | null;
  refundStatus?: string | null;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  createdAt: string;
  updatedAt: string;
}

// GST Compliance
export const GstReturnTypeEnum = z.enum(["GSTR1", "GSTR3B", "GSTR9"]);
export type GstReturnType = z.infer<typeof GstReturnTypeEnum>;

export const GstFilingFrequencyEnum = z.enum(["MONTHLY", "QRMP"]);
export type GstFilingFrequency = z.infer<typeof GstFilingFrequencyEnum>;

export interface GstReturnRecord {
  id: string;
  clientId: string;
  clientName?: string;
  workType?: string | null;
  returnType: GstReturnType;
  period: string;
  filingFrequency: GstFilingFrequency;
  dueDate: string;
  status: "NOT_STARTED" | "PENDING" | "FILED" | "OVERDUE";
  filedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Client Service / Work Items Management
export const ServiceTypeEnum = z.enum([
  "INCOME_TAX_RETURN",
  "GST_RETURN",
  "GST_REGISTRATION"
]);
export type ServiceType = z.infer<typeof ServiceTypeEnum>;

export const ServicePaymentStatusEnum = z.enum([
  "PENDING",
  "PAID",
  "PARTIAL",
  "WAIVED"
]);
export type ServicePaymentStatus = z.infer<typeof ServicePaymentStatusEnum>;

export const ServiceWorkStatusEnum = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
  "ON_HOLD"
]);
export type ServiceWorkStatus = z.infer<typeof ServiceWorkStatusEnum>;

export const ClientServiceSchema = z.object({
  serviceType: ServiceTypeEnum,
  serviceName: z.string().optional(),
  fee: z.number().min(0, "Fee cannot be negative").default(0),
  paymentStatus: ServicePaymentStatusEnum.default("PENDING"),
  workStatus: ServiceWorkStatusEnum.default("NOT_STARTED"),
  serviceData: z.record(z.any()).optional().nullable()
});
export type ClientServiceDTO = z.infer<typeof ClientServiceSchema>;

export interface ClientServiceRecord {
  id: string;
  clientId: string;
  clientName?: string;
  serviceType: ServiceType;
  serviceName?: string | null;
  fee: number;
  paymentStatus: ServicePaymentStatus;
  workStatus: ServiceWorkStatus;
  serviceData?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

// TDS / TCS
export const TdsEntryTypeEnum = z.enum(["TDS", "TCS"]);
export type TdsEntryType = z.infer<typeof TdsEntryTypeEnum>;

export interface TdsTcsEntryRecord {
  id: string;
  clientId: string;
  clientName?: string;
  financialYear: string;
  deductorTan: string;
  amount: number;
  entryType: TdsEntryType;
  sourceDocId?: string | null;
  reconciliationStatus: "MATCHED" | "MISMATCH_UNDER" | "MISMATCH_OVER" | "UNRECONCILED";
  refundStatus?: string | null;
  expectedAmount: number;
  creditedAmount: number;
  mismatchAmount: number;
  createdAt: string;
  updatedAt: string;
}

// Billing & Payments
export const InvoiceStatusEnum = z.enum(["DRAFT", "SENT", "PAID", "OVERDUE"]);
export type InvoiceStatus = z.infer<typeof InvoiceStatusEnum>;

export interface InvoiceLineItem {
  description: string;
  amount: number;
}

export interface InvoiceRecord {
  id: string;
  invoiceNo: string;
  clientId: string;
  clientName?: string;
  subtotal: number;
  tax: number;
  total: number;
  lineItems: InvoiceLineItem[];
  dueDate: string;
  status: InvoiceStatus;
  upiLink: string;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  amount: number;
  method: "UPI" | "BANK_TRANSFER" | "CASH" | "OTHER";
  status: "SUCCESS" | "FAILED" | "PENDING";
  paidAt: string;
}

// Tasks & Workflows
export const TaskStatusEnum = z.enum(["TODO", "IN_PROGRESS", "DONE"]);
export type TaskStatus = z.infer<typeof TaskStatusEnum>;

export const TaskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export type TaskPriority = z.infer<typeof TaskPriorityEnum>;

export interface TaskRecord {
  id: string;
  title: string;
  clientId: string;
  clientName?: string;
  moduleRef?: string | null;
  assignedTo?: string | null;
  assignedToName?: string | null;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  autoGenerated?: boolean;
  createdAt: string;
  updatedAt: string;
}

// WhatsApp Integration
export interface WhatsAppTemplateRecord {
  id: string;
  name: string;
  category: "UTILITY" | "MARKETING" | "AUTHENTICATION";
  body: string;
  variables: string[];
  approvalStatus: "APPROVED" | "PENDING" | "REJECTED";
  createdAt: string;
}

export interface WhatsAppMessageRecord {
  id: string;
  clientId: string;
  clientName?: string;
  templateId?: string | null;
  direction: "INBOUND" | "OUTBOUND";
  body: string;
  status: "SENT" | "DELIVERED" | "READ" | "FAILED" | "RECEIVED";
  cost: number;
  sentAt: string;
}

// AI Assistant
export interface AiMessageRecord {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  sourceType?: "structured" | "rag" | "fallback";
  createdAt: string;
}

export interface AiConversationRecord {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  messages: AiMessageRecord[];
}

// Audit Logs
export interface AuditLogRecord {
  id: string;
  userId?: string | null;
  userName?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before?: any;
  after?: any;
  ipAddress?: string | null;
  createdAt: string;
}

// Standard API Response & Pagination
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface DailyActivityRecord {
  day: string;
  date: string;
  filings: number;
  tasks: number;
}

// Dashboard Aggregated KPIs
export interface DashboardSummaryResponse {
  // Primary 4 KPI Metrics
  totalRevenue: number;
  totalRevenueThisMonth: number;
  totalRevenueComparison: string | null;

  activeClients: number;
  activeClientsComparison: string | null;

  pendingFilings: number;
  pendingFilingsOverdue: number;
  pendingFilingsComparison: string | null;

  totalLeads: number;
  newLeadsThisMonth: number;
  totalLeadsComparison: string | null;

  // Weekly Activity Graph
  weeklyActivity: DailyActivityRecord[];

  // Backward compatibility fields for other widgets
  totalClients: number;
  totalClientsActive: number;
  totalClientsComparison: string | null;
  itrPending: number;
  itrOverdue: number;
  itrComparison: string | null;
  gstReturnsDue: number;
  gstReturnsOverdue: number;
  gstComparison: string | null;
  outstandingFees: number;
  outstandingFeesOverdue: number;
  outstandingFeesComparison: string | null;
}

// Tax Audit (Section 44AB)
export const TaxAuditStageEnum = z.enum([
  "ENGAGEMENT",
  "BOOKS_AUDIT",
  "FORM_3CD_PREP",
  "UDIN_GENERATED",
  "PORTAL_FILED",
  "CLIENT_ACCEPTED"
]);
export type TaxAuditStage = z.infer<typeof TaxAuditStageEnum>;

export const TaxAuditFormTypeEnum = z.enum(["FORM_3CA_3CD", "FORM_3CB_3CD"]);
export type TaxAuditFormType = z.infer<typeof TaxAuditFormTypeEnum>;

export interface TaxAuditClauseItem {
  clauseNumber: number;
  title: string;
  category: string;
  isApplicable: boolean;
  status: "PENDING" | "VERIFIED" | "FLAGGED";
  remarks?: string;
}

export interface TaxAuditRecord {
  id: string;
  clientId: string;
  clientName: string;
  pan: string;
  entityType: string;
  assessmentYear: string;
  formType: TaxAuditFormType;
  turnover: number;
  cashTxnPercentage: number;
  isCashLimitCompliant: boolean;
  stage: TaxAuditStage;
  dueDate: string;
  udin?: string | null;
  acknowledgementNo?: string | null;
  assignedAuditorId?: string | null;
  assignedAuditorName?: string | null;
  verifiedClausesCount: number;
  totalClausesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaxAuditDTO {
  clientId: string;
  assessmentYear: string;
  formType: TaxAuditFormType;
  turnover: number;
  cashTxnPercentage?: number;
  assignedAuditorId?: string;
  dueDate?: string;
}

// GST Registration (Section 22-25 CGST)
export const GstRegStageEnum = z.enum([
  "TRN_GENERATED",
  "ARN_SUBMITTED",
  "AADHAAR_AUTH",
  "CLARIFICATION_PENDING",
  "APPROVED_ISSUED"
]);
export type GstRegStage = z.infer<typeof GstRegStageEnum>;

export const GstRegTypeEnum = z.enum([
  "REGULAR",
  "COMPOSITION",
  "VOLUNTARY",
  "CASUAL",
  "NON_RESIDENT",
  "ISD"
]);
export type GstRegType = z.infer<typeof GstRegTypeEnum>;

export interface GstRegistrationRecord {
  id: string;
  businessName: string;
  pan: string;
  entityType: string;
  registrationType: GstRegType;
  state: string;
  jurisdictionWard?: string | null;
  trn?: string | null;
  arn?: string | null;
  stage: GstRegStage;
  submissionDate?: string | null;
  aadhaarAuthStatus: "PENDING" | "VERIFIED" | "FAILED" | "EXEMPT";
  queryNoticeRef?: string | null;
  queryNoticeDate?: string | null;
  queryReplyDate?: string | null;
  gstin?: string | null;
  approvalDate?: string | null;
  contactPhone: string;
  contactEmail?: string | null;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  clientId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGstRegDTO {
  businessName: string;
  pan: string;
  entityType: string;
  registrationType: GstRegType;
  state: string;
  jurisdictionWard?: string;
  trn?: string;
  contactPhone: string;
  contactEmail?: string;
  assignedStaffId?: string;
  clientId?: string;
}
