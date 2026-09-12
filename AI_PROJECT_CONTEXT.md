# AI PROJECT CONTEXT

## 0. DOCUMENT PURPOSE

> **READ THIS FILE FIRST BEFORE ANALYZING THE REPOSITORY.**

This document is the authoritative, single comprehensive source-of-truth for **TaxFlow (CA Practice Automation SaaS)**. It captures the entire system architecture, technical decisions, data models, APIs, workflows, and implementation nuances across the monorepo.

Future AI agents and developers must consult this document before making code alterations or conducting redundant repository-wide scans. When making architectural, database, API, or dependency adjustments, update this document in accordance with the [Context Maintenance Rule](#34-context-maintenance-rule).

---

# 1. PROJECT OVERVIEW

- **Project Name**: TaxFlow (CA Practice Automation & Audit SaaS)
- **Project Purpose**: Enterprise full-stack multi-tenant practice management and statutory compliance automation suite tailored for Indian Chartered Accountants (CAs), tax practitioners, and audit firms.
- **Business Domain**: Indian Direct & Indirect Taxation (Income Tax Act 1961, CGST/SGST Acts 2017, Section 44AB Tax Audits, TDS/TCS Chapter XVII-B, MCA Compliance, and Practice Billing).
- **Target Users**:
  - **SuperAdmin / Managing Partners**: Complete practice visibility, staff assignment, revenue metrics, audit logs, and system settings.
  - **Auditors / Tax Associates / Staff**: Execution of ITR preparation, GSTR filing, 3CD clause verification, client document checklists, and task Kanban.
  - **Clients / Taxpayers**: Document submission, real-time filing status monitoring, digital payment of fee invoices via dynamic UPI QR.
- **Primary Workflows**:
  1. **Client & Lead Management**: Onboarding clients with PAN/GSTIN validation, risk tagging, and automatic creation of statutory filings.
  2. **ITR Compliance Tracker**: Tracking Assessment Year filings (AY 2026-27), form selection (ITR-1 through ITR-6), audit applicability, and acknowledgement numbers.
  3. **GST Compliance Tracker**: Tracking GSTR-1, GSTR-3B monthly/QRMP returns with automated statutory due date engine (20th of subsequent month).
  4. **Tax Audit Suite (Section 44AB)**: Form 3CA/3CB-3CD engagement management with a 9-clause statutory scrutiny checklist (MSME 43B(h), Section 40A(3), Section 269SS/T, etc.).
  5. **GST Registration Pipeline**: Tracking end-to-end TRN -> ARN -> Aadhaar Auth -> Query Clarification -> GSTIN issuance.
  6. **Document Vault**: Multi-source file ingestion (PAN, Bank Statements, Aadhaar) with mandatory checklist verification.
  7. **Billing & Dynamic UPI**: Invoicing with 18% GST calculation, dynamic UPI link/QR generation, payment reconciliation, and overdue aging.
  8. **WhatsApp Client Hub**: Automated compliance deadline broadcast templates and direct client notifications.
  9. **AI Practice Assistant**: Hybrid router with structured intent matching and local/remote LLM (Ollama) fallback.

### Architecture Diagram

```text
                               +-------------------------------------------------------+
                               |                  Client Browsers                      |
                               |    React 18 SPA (Vite + Tailwind CSS + Redux Query)   |
                               +---------------------------+---------------------------+
                                                           | HTTPS / REST / Cookies
                                                           v
                               +-------------------------------------------------------+
                               |                  Express.js API Layer                 |
                               | (Helmet, CORS, Rate Limit, JWT, Pino, Compression)    |
                               +---------------------------+---------------------------+
                                                           |
                      +------------------------------------+-----------------------------------+
                      |                                    |                                   |
                      v                                    v                                   v
        +----------------------------+       +----------------------------+      +----------------------------+
        |     Modules & Services     |       |    Statutory Engines       |      |     External Adapters      |
        | - Auth & RBAC              |       | - DueDateEngine            |      | - WhatsApp (Cloud/Mock)    |
        | - Clients & Leads          |       | - TaxAudit Clause Checker  |      | - Ollama AI / LLM          |
        | - ITR & GST Compliance     |       | - 26AS TDS Reconciler      |      | - MinIO / Local Disk       |
        | - Billing & Tasks          |       | - In-Process EventBus      |      | - Payment Gateway Adapter  |
        +--------------+-------------+       +----------------------------+      +----------------------------+
                       |
                       v
        +----------------------------+
        |   Prisma ORM Client        |
        +--------------+-------------+
                       |
                       v
        +------------------------------------------------------+
        |           PostgreSQL (ankane/pgvector)               |
        | 17 Models: Users, Roles, Clients, Filings, Invoices  |
        +------------------------------------------------------+
```

---

# 2. TECHNOLOGY STACK

| Category | Technology | Version | Purpose | Important Notes |
| -------- | ---------- | ------- | ------- | --------------- |
| **Monorepo / Workspace** | npm workspaces | 10.x / 11.x | Orchestrates shared packages and applications | `packages/*`, `apps/*` |
| **Backend Runtime** | Node.js | v20 LTS / v24 | Backend application server | Runs via `tsx` dev and `tsc` prod |
| **Backend Framework** | Express.js | ^4.19.2 | REST API routing and HTTP handling | Centralized router in `apps/api/src/app.ts` |
| **Database** | PostgreSQL | 15+ (pgvector) | Relational primary data store with vector extension | Runs via `ankane/pgvector:v0.5.1` in Docker |
| **ORM / Query Tool** | Prisma | ^5.14.0 / 5.22.0 | Schema management, migrations, typed DB queries | Schema at `prisma/schema.prisma` |
| **Frontend Framework** | React | ^18.3.1 | Single Page Application UI | SPA with functional components and hooks |
| **Build & Bundler** | Vite | ^5.2.11 / ^5.4.21 | Frontend dev server and production bundler | Code-splitting chunks in `apps/web/vite.config.ts` |
| **CSS & Styling** | Tailwind CSS | ^3.4.3 | Utility-first CSS styling and dark mode | Configured with `class` dark mode in `tailwind.config.js` |
| **State Management** | Redux Toolkit & RTK Query | ^2.2.5 | Global client cache, API state synchronization | Configured in `apps/web/src/app/store.ts` |
| **Routing** | React Router DOM | ^6.23.1 | Client-side routing with route-level code splitting | `apps/web/src/app/router.tsx` |
| **Data Validation** | Zod | ^3.23.8 | Request payload and DTO validation | Shared between frontend and backend via `shared-types` |
| **Authentication** | JSON Web Token (JWT) | ^9.0.2 | Stateless access tokens (15m) & refresh tokens (7d) | `apps/api/src/lib/jwt.ts` |
| **Password Hashing** | Argon2 | ^0.40.1 | Memory-hard password hashing algorithm | Argon2id used for user credentials |
| **Logging** | Pino & Pino-Pretty | ^9.1.0 / ^11.1.0 | High-performance structured JSON logging | Configured in `apps/api/src/lib/logger.ts` |
| **Icons** | Lucide React | ^0.379.0 | Iconography across navigation and action buttons | Consistent sizing (16px to 24px) |
| **File Storage** | Local Disk / MinIO | S3 API | Storage of taxpayer documents (PAN, statements) | `LocalDiskStorageAdapter` fallback |
| **Testing (Unit/Integration)** | Jest & ts-jest | ^29.7.0 | Backend unit and statutory calculation tests | Configured in `apps/api/jest.config.js` |
| **Testing (E2E)** | Playwright | ^1.63.0 | Cross-browser end-to-end integration tests | Configured in root `playwright.config.ts` |
| **Containerization** | Docker & Compose | 3.8 | Local & production orchestration | `docker-compose.yml` defining postgres, ollama, minio |

---

# 3. REPOSITORY STRUCTURE

```text
ca-saas/
├── .github/
│   └── workflows/
│       └── ci.yml                     # GitHub Actions CI/CD pipeline (main & master)
├── apps/
│   ├── api/                           # Express.js REST API service
│   │   ├── src/
│   │   │   ├── adapters/              # External integrations (Storage, Ollama, WhatsApp)
│   │   │   ├── config/                # Environment variables and application config
│   │   │   ├── lib/                   # Database instance, JWT, event bus, due date engine
│   │   │   ├── middleware/            # Auth guard, error handling, rate limiting, logging
│   │   │   ├── modules/               # Domain feature modules (routes, controllers, services)
│   │   │   │   ├── admin/             # User management, roles, audit log viewer
│   │   │   │   ├── ai-assistant/      # Hybrid intent router and RAG assistant
│   │   │   │   ├── auth/              # Login, register, signup, token refresh, logout
│   │   │   │   ├── billing/           # Invoices, dynamic UPI links, payment tracking
│   │   │   │   ├── clients/           # Client CRM, Lead management, statutory sync
│   │   │   │   ├── dashboard/         # Aggregated KPI cards, comparisons, weekly activity
│   │   │   │   ├── documents/         # Document upload, categorization, checklist tracking
│   │   │   │   ├── gst/               # GSTR-1, GSTR-3B filings, upcoming deadlines
│   │   │   │   ├── gst-registration/  # GST registration stage pipeline (TRN/ARN)
│   │   │   │   ├── health/            # Health checks for app, postgres, ollama
│   │   │   │   ├── itr/               # Income Tax Return AY 2026-27 tracking
│   │   │   │   ├── tasks/             # Kanban task board, auto-generated tasks
│   │   │   │   ├── tax-audit/         # Section 44AB Form 3CD checklist verification
│   │   │   │   ├── tds-tcs/           # Form 26AS TDS/TCS reconciliation entries
│   │   │   │   ├── webhooks/          # External webhook receiver (WhatsApp/Payments)
│   │   │   │   └── whatsapp/          # WhatsApp messaging hub and spend metrics
│   │   │   ├── app.ts                 # Express application initialization and middleware
│   │   │   └── server.ts              # HTTP server listener and DB connect
│   │   ├── tests/                     # Unit and engine tests (billing, due dates)
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                           # Vite + React 18 Single Page Application
│       ├── src/
│       │   ├── app/                   # App root, Redux store, React Router configuration
│       │   ├── components/
│       │   │   ├── layout/            # AppShell, Sidebar, Topbar, CmdKModal, NotificationDrawer
│       │   │   └── ui/                # Button, Input, Modal, Table, StatusBadge, Stepper, etc.
│       │   ├── context/               # ThemeContext (Light / Dark mode persistence)
│       │   ├── features/              # Feature page components matching backend modules
│       │   ├── lib/                   # RTK Query API endpoints (`api.ts`), utilities
│       │   ├── index.css              # Global styles and Tailwind directives
│       │   └── main.tsx               # Frontend entry point
│       ├── package.json
│       ├── tailwind.config.js
│       └── vite.config.ts
├── packages/
│   └── shared-types/                  # Shared TypeScript interfaces, types, and Zod schemas
│       ├── src/
│       │   └── index.ts               # Universal source of truth for DTOs and entities
│       ├── package.json
│       └── tsconfig.json
├── prisma/
│   ├── schema.prisma                  # Complete PostgreSQL Prisma schema (17 models)
│   └── seed.ts                        # Database seeding script (SuperAdmin setup)
├── storage/                           # Local filesystem document uploads directory
├── docker-compose.yml                 # Multi-container Docker configuration
├── render.yaml                        # Render.com deployment manifest for API
├── vercel.json                        # Vercel deployment configuration for Web
├── package.json                       # Monorepo root package.json
└── tsconfig.json                      # Monorepo root TypeScript configuration
```

---

# 4. COMPLETE FILE / MODULE INVENTORY

| File / Directory | Purpose | Important Exports | Dependencies | Used By | Criticality |
| ---------------- | ------- | ----------------- | ------------ | ------- | ----------- |
| `packages/shared-types/src/index.ts` | Shared domain types, enums, and Zod validation schemas | `ClientDTO`, `ItrFilingRecord`, `DashboardSummaryResponse`, `TaxAuditRecord`, etc. | `zod` | Frontend & Backend | **CRITICAL** |
| `prisma/schema.prisma` | Relational database schema with 17 models | Prisma Client Models | PostgreSQL | Entire Backend | **CRITICAL** |
| `prisma/seed.ts` | Clean database setup, seed SuperAdmin | `main()` | `@prisma/client`, `argon2` | CI/CD, Local Dev | **HIGH** |
| `apps/api/src/server.ts` | API entry point; connects to DB and listens on port | `startServer()` | `app.ts`, `prisma` | Node runtime | **CRITICAL** |
| `apps/api/src/app.ts` | Express middleware setup, CORS, and route mounting | `app` | `express`, `helmet`, `cors`, routes | `server.ts`, tests | **CRITICAL** |
| `apps/api/src/lib/db.ts` | Singleton PrismaClient database connection | `prisma` | `@prisma/client` | All services | **CRITICAL** |
| `apps/api/src/lib/jwt.ts` | JWT access and refresh token generation and verification | `generateAccessToken`, `verifyAccessToken`, `hashRefreshToken` | `jsonwebtoken`, `crypto` | `auth.service`, `middleware/auth` | **CRITICAL** |
| `apps/api/src/lib/due-date-engine.ts` | Indian statutory deadline calculator for ITR and GST | `DueDateEngine` | None | `itr.service`, `gst.service`, `clients.service` | **HIGH** |
| `apps/api/src/lib/event-bus.ts` | Decoupled asynchronous in-process event pub/sub | `eventBus` | Node `EventEmitter` | Audit, Client sync | **MEDIUM** |
| `apps/api/src/lib/permissions.ts` | Role-based row-level client access scoping | `scopeToAssignedClients`, `verifyClientAccess` | None | All CRUD services | **CRITICAL** |
| `apps/api/src/middleware/auth.ts` | Authentication guard verifying JWT bearer tokens | `requireAuth` | `jwt.ts`, `prisma` | All protected routes | **CRITICAL** |
| `apps/api/src/middleware/errorHandler.ts` | Centralized Express error handler with structured HTTP responses | `errorHandler`, custom Error classes | Express | `app.ts` | **HIGH** |
| `apps/api/src/modules/dashboard/dashboard.service.ts` | Real-time practice KPI aggregations and activity trends | `DashboardService` | `prisma`, `permissions` | `dashboard.controller` | **HIGH** |
| `apps/api/src/modules/clients/clients.service.ts` | Client and lead CRM logic with auto filing generation | `ClientsService` | `prisma`, `eventBus`, `DueDateEngine` | `clients.controller` | **CRITICAL** |
| `apps/api/src/modules/itr/itr.service.ts` | ITR lifecycle management and status transitions | `ItrService` | `prisma`, `DueDateEngine` | `itr.controller` | **HIGH** |
| `apps/api/src/modules/gst/gst.service.ts` | GSTR monthly/QRMP return tracking and due date computation | `GstService` | `prisma`, `DueDateEngine` | `gst.controller` | **HIGH** |
| `apps/api/src/modules/tax-audit/tax-audit.service.ts` | Section 44AB Form 3CD audit clause checklist workflow | `TaxAuditService` | `prisma`, `shared-types` | `tax-audit.controller` | **HIGH** |
| `apps/api/src/modules/gst-registration/gst-registration.service.ts` | Multi-stage GST registration pipeline | `GstRegistrationService` | `prisma`, `shared-types` | `gst-registration.controller` | **MEDIUM** |
| `apps/api/src/modules/billing/billing.service.ts` | Invoicing, GST tax calculation, and UPI deep-link generation | `BillingService` | `prisma` | `billing.controller` | **HIGH** |
| `apps/web/src/main.tsx` | React app mounting and Redux/Theme provider wrapping | None | React, ReactDOM | Browser runtime | **CRITICAL** |
| `apps/web/src/app/router.tsx` | Lazy route definitions and protected route guard | `AppRouter` | `react-router-dom` | `main.tsx` | **CRITICAL** |
| `apps/web/src/app/store.ts` | Redux store configuration with RTK Query middleware | `store`, `RootState`, `AppDispatch` | `@reduxjs/toolkit` | `main.tsx` | **HIGH** |
| `apps/web/src/lib/api.ts` | RTK Query API slice with auto-caching and tag invalidation | `api`, generated hooks | `@reduxjs/toolkit/query/react` | All feature pages | **CRITICAL** |
| `apps/web/src/context/ThemeContext.tsx` | Dark/Light theme state and HTML root class toggling | `ThemeProvider`, `useTheme` | React | All UI components | **MEDIUM** |
| `apps/web/src/components/layout/AppShell.tsx` | Main responsive dashboard shell with sidebar and topbar | `AppShell` | React, React Router | Protected routes | **HIGH** |

---

# 5. APPLICATION ARCHITECTURE

### Communication & Data Flow
1. **Frontend Interactions**: User actions trigger dispatch calls via RTK Query hooks (e.g. `useGetClientsQuery`, `useUpdateClientMutation`).
2. **HTTP / JSON API**: Requests are sent to `/api/*` with `Authorization: Bearer <accessToken>` headers and standard JSON bodies.
3. **API Gateway & Routing**: `apps/api/src/app.ts` parses cookies, validates CORS against trusted domains, compresses responses (`compression`), logs request durations (`requestLogger`), and routes to modular sub-routers.
4. **Middleware Pipeline**:
   - `requireAuth` validates the access token, extracting `userId` and `role`.
   - `requireRole` ensures proper RBAC authorization (e.g. SuperAdmin-only for `/api/admin/*`).
5. **Controller Layer**: Decodes HTTP inputs, performs Zod schema validation using shared schemas from `@ca-saas/shared-types`.
6. **Service Layer**: Executes business rules, queries PostgreSQL via Prisma ORM, publishes domain events via `eventBus`, and manages in-memory caching.
7. **Database Scoping**: Multi-tenancy and data isolation are enforced using `scopeToAssignedClients`: non-SuperAdmin staff can only access clients explicitly assigned to them.
8. **Asynchronous Processing**: Background triggers (e.g. audit logging, checklist completion events) run out-of-band to maintain low API response latency.

---

# 6. FRONTEND ARCHITECTURE

### Structure & Layout
- **Root Shell (`AppShell.tsx`)**: Renders a collapsible desktop/mobile `Sidebar`, a sticky `Topbar` with search, dynamic notifications drawer, quick `Cmd+K` global spotlight modal, and the `ThemeToggle` switch.
- **Theme System**: Full light and dark mode support using Tailwind `dark:` classes, controlled by `ThemeContext` which syncs with `localStorage.getItem("taxflow_theme")`.
- **State Management**: Zero boilerplate server-state caching powered by **RTK Query** with automatic cache tags (`Clients`, `Itr`, `Gst`, `TaxAudit`, `Invoices`, `Tasks`, `WhatsApp`).

### Major Screens

#### 1. Dashboard (`/dashboard`)
- **Purpose**: High-level CA operational health command center.
- **Components**: 4 KPI summary cards (Total Revenue, Active Clients, Pending Filings, Total Leads), weekly activity chart, recent statutory alerts.
- **Interactions**: Clicking any KPI card deep-links to the respective module with pre-applied status filters.
- **Cache**: 15s in-memory server cache for instant navigation.

#### 2. Client & Lead Management (`/clients`, `/leads`, `/clients/:id`)
- **Purpose**: Client CRM, KYC profile details, and statutory assignment.
- **Components**: Searchable data table with entity filters (Individual, LLP, Pvt Ltd), Add Client modal with PAN/GSTIN regex validation, Client Detail tabs (Overview, Documents, Filings, Billing).

#### 3. ITR Compliance Dashboard (`/itr`)
- **Purpose**: Track Assessment Year 2026-27 filings across preparation stages.
- **Tabs**: All, Pending Actions, Filed & Verified.
- **Actions**: Update filing status modal (enter e-filing Acknowledgement Number, refund status).

#### 4. GST Compliance Hub (`/gst`)
- **Purpose**: Track GSTR-1 and GSTR-3B filings by period and filing frequency.
- **Badges**: Automated `Due Soon` and `Overdue` alerts based on statutory dates.
- **Actions**: Mark Filed action updates portal timestamps and records audit logs.

#### 5. Tax Audit Suite (`/tax-audit`)
- **Purpose**: Section 44AB compliance audit management for corporate/high-turnover clients.
- **Checklist**: Interactive 9-clause Form 3CD audit verification checklist with status flags (`PENDING`, `VERIFIED`, `FLAGGED`).

#### 6. Document Center (`/documents`)
- **Purpose**: Document vault supporting client grouping and checklist completeness.
- **Features**: Drag-and-drop file upload, document type tagging (PAN, Bank Statement, Aadhaar), download and delete actions.

#### 7. Billing & Invoicing (`/billing`)
- **Purpose**: Practice invoicing, automated 18% GST calculation, and UPI deep links.
- **Features**: Create invoice with dynamic line items, dynamic UPI QR modal for client payments, Mark Paid action.

---

# 7. BACKEND ARCHITECTURE

### Request Lifecycle
```text
Client Request
  ↓
helmet() [Security Headers]
  ↓
cors() [Origin Filtering & Credentials]
  ↓
compression() [Gzip/Deflate compression]
  ↓
express.json() & express.urlencoded()
  ↓
cookieParser()
  ↓
requestLogger [Timing & Pino Logging]
  ↓
Router Matching (/api/<module>)
  ↓
requireAuth [JWT Verification & User Scoping]
  ↓
requireRole(roles) [RBAC Authorization]
  ↓
Controller [Zod Schema Parsing]
  ↓
Service [Business Logic & Permissions Scope]
  ↓
Prisma ORM [Parameterized SQL to PostgreSQL]
  ↓
eventBus.publish() [Async Domain Event Triggers]
  ↓
Response Serialization & HTTP 200/201
  ↓
errorHandler [Catches unhandled errors & maps to HTTP status]
```

---

# 8. COMPLETE API INVENTORY

| Method | Endpoint | Purpose | Auth | Request Body / Params | Response | Cache / Tags |
| ------ | -------- | ------- | ---- | --------------------- | -------- | ------------ |
| `POST` | `/api/auth/login` | User login & token generation | Public | `{ email, password }` | `{ user, accessToken }` + Refresh Cookie | None |
| `POST` | `/api/auth/signup` | SuperAdmin registration | Public | `{ name, email, password, firmName }` | `{ user, accessToken }` | None |
| `POST` | `/api/auth/refresh` | Rotate expired access token | Cookie | None (reads cookie) | `{ accessToken }` | None |
| `POST` | `/api/auth/logout` | Revoke refresh token | Auth | None | `{ message }` | None |
| `GET` | `/api/auth/me` | Fetch active user session | Auth | None | `{ user }` | `Auth` |
| `GET` | `/api/dashboard/summary` | Real-time practice KPI metrics | Auth | None | `DashboardSummaryResponse` | 15s MemCache |
| `GET` | `/api/clients` | List paginated clients | Auth | Query: `page, pageSize, search, status, entityType, workType` | `PaginatedResult<ClientRecord>` | `Clients` |
| `POST` | `/api/clients` | Create client and auto-sync filings | Auth | `ClientSchema` DTO | `ClientRecord` | Invalidates `Clients`, `Itr`, `Gst` |
| `GET` | `/api/clients/:id` | Full client dossier | Auth | Path: `id` | `Client` with relations | `Clients` |
| `PUT` | `/api/clients/:id` | Update client details | Auth | Partial `ClientDTO` | Updated `Client` | Invalidates `Clients` |
| `DELETE` | `/api/clients/:id` | Delete client & cascade | SuperAdmin | Path: `id` | `{ message }` | Invalidates `Clients` |
| `GET` | `/api/documents` | List uploaded documents | Auth | Query: `clientId, docType, search` | `PaginatedResult<ClientDocumentRecord>` | `Documents` |
| `POST` | `/api/documents/upload` | Upload client file | Auth | `multipart/form-data`: `file, clientId, docType` | Created `ClientDocument` | Invalidates `Documents` |
| `GET` | `/api/documents/:id/download` | Stream secure document file | Auth | Path: `id` | Binary File Stream | None |
| `DELETE` | `/api/documents/:id` | Delete document | Auth | Path: `id` | `{ message }` | Invalidates `Documents` |
| `GET` | `/api/itr` | List ITR filings | Auth | Query: `clientId, status, page` | `PaginatedResult<ItrFilingRecord>` | `Itr` |
| `PATCH` | `/api/itr/:id/status` | Update ITR status & ackNo | Auth | `{ status, acknowledgementNo, refundStatus }` | Updated `ItrFiling` | Invalidates `Itr` |
| `GET` | `/api/gst` | List GST returns | Auth | Query: `clientId, returnType, status, page` | `PaginatedResult<GstReturnRecord>` | `Gst` |
| `GET` | `/api/gst/upcoming-due` | Returns due within 30 days | Auth | None | `GstReturnRecord[]` | `Gst` |
| `PATCH` | `/api/gst/:id/mark-filed` | Mark return filed | Auth | Path: `id` | Updated `GstReturn` | Invalidates `Gst` |
| `GET` | `/api/tax-audit` | List Section 44AB audits | Auth | Query: `page, pageSize, search, stage` | `PaginatedResult<TaxAuditRecord>` | `TaxAudit` |
| `GET` | `/api/tax-audit/summary` | Tax audit pipeline breakdown | Auth | None | Summary counts | `TaxAudit` |
| `GET` | `/api/tax-audit/:id/clauses` | Form 3CD clauses checklist | Auth | Path: `id` | `TaxAuditClauseItem[]` | `TaxAudit` |
| `PATCH` | `/api/tax-audit/:id/clauses/:clauseNumber` | Verify/flag 3CD clause | Auth | `{ status, remarks }` | Updated `TaxAuditClauseItem` | Invalidates `TaxAudit` |
| `GET` | `/api/gst-registration` | List GST registrations | Auth | Query: `page, search, stage` | `PaginatedResult<GstRegistrationRecord>` | `GstRegistration` |
| `PATCH` | `/api/gst-registration/:id/stage` | Advance registration stage | Auth | `{ targetStage, arn, gstin, noticeRef }` | Updated record | Invalidates `GstRegistration` |
| `GET` | `/api/invoices` | List invoices | Auth | Query: `status, page, pageSize` | `PaginatedResult<InvoiceRecord>` | `Invoices` |
| `POST` | `/api/invoices` | Create invoice with 18% GST | Auth | `{ clientId, lineItems, dueDate }` | Created `InvoiceRecord` | Invalidates `Invoices` |
| `POST` | `/api/invoices/:id/mark-paid` | Mark invoice paid | Auth | `{ method }` | Updated `InvoiceRecord` | Invalidates `Invoices` |
| `GET` | `/api/invoices/:id/upi-link` | Fetch dynamic UPI QR link | Auth | Path: `id` | `{ upiLink, qrData }` | `Invoices` |
| `GET` | `/api/tasks` | List Kanban tasks | Auth | Query: `status, priority, assignedTo` | `PaginatedResult<TaskRecord>` | `Tasks` |
| `PATCH` | `/api/tasks/:id/status` | Move task status | Auth | `{ status }` | Updated `TaskRecord` | Invalidates `Tasks` |
| `POST` | `/api/ai-assistant/query` | Practice AI RAG query | Auth | `{ query }` | `{ answer, sourceType }` | None |
| `GET` | `/api/admin/users` | List staff and users | SuperAdmin | Query: `page, search` | `PaginatedResult<User>` | `Admin` |
| `GET` | `/api/admin/audit-logs` | Query system audit trail | SuperAdmin | Query: `entityType, action` | `PaginatedResult<AuditLogRecord>` | `Admin` |
| `GET` | `/health` | Service uptime health check | Public | None | `{ status: "UP", uptime }` | None |

---

# 9. DATABASE ARCHITECTURE

### Prisma Models & Relations
- **`User`**: System identity (`id`, `name`, `email`, `passwordHash`, `roleId`, timestamps). Relations to `Role`, `RefreshToken`, `Client` (assigned staff), `ItrFiling`, `Task`, `AuditLog`.
- **`Role`**: Authorization roles (`id`, `name` [`SuperAdmin`, `Admin`, `Staff`, `Client`], `description`).
- **`RefreshToken`**: Stored SHA-256 token hashes for refresh rotation (`id`, `userId`, `tokenHash`, `expiresAt`, `revoked`).
- **`Client`**: Central practice entity (`id`, `name`, `pan` [unique], `gstin` [unique], `entityType`, `contactPhone`, `contactEmail`, `workType`, `assignedStaffId`, `status` [`ACTIVE`, `LEAD`, `INACTIVE`]).
- **`ClientDocument`**: Uploaded KYC/financial docs (`id`, `clientId`, `docType` [PAN, BANK_STATEMENT, AADHAAR], `fileUrl`, `fileName`, `uploadedBy`, `status`).
- **`ItrFiling`**: Statutory ITR record (`id`, `clientId`, `assessmentYear`, `itrFormType` [ITR_1..6], `dueDate`, `status` [NOT_STARTED..FILED], `acknowledgementNo`).
- **`GstReturn`**: GST periodic return (`id`, `clientId`, `returnType` [GSTR1, GSTR3B, GSTR9], `period`, `filingFrequency`, `dueDate`, `status`).
- **`TdsTcsEntry`**: Form 26AS line item (`id`, `clientId`, `financialYear`, `deductorTan`, `amount`, `reconciliationStatus`).
- **`Invoice`**: Practice bill (`id`, `invoiceNo` [unique], `clientId`, `subtotal`, `tax`, `total`, `lineItems`, `dueDate`, `status` [DRAFT, SENT, PAID, OVERDUE], `upiLink`).
- **`Payment`**: Payments against invoices (`id`, `invoiceId`, `amount`, `method` [UPI, BANK_TRANSFER], `status`, `paidAt`).
- **`Task`**: Compliance action item (`id`, `title`, `clientId`, `assignedTo`, `dueDate`, `status` [TODO, IN_PROGRESS, DONE], `priority`).
- **`WhatsAppTemplate` & `WhatsAppMessage`**: Template definitions and outbound message delivery tracking.
- **`AuditLog`**: Immutable activity trail (`id`, `userId`, `action`, `entityType`, `entityId`, `before`, `after`, `ipAddress`, `createdAt`).

---

# 10. DATABASE QUERY / PERFORMANCE MAP

### Indexing & Query Patterns
- **High-frequency filter indexes**:
  - `Client`: Indexes on `pan`, `gstin`, `assignedStaffId`, `status`, `workType`.
  - `ItrFiling`: Indexes on `clientId`, `dueDate`, `status`.
  - `GstReturn`: Indexes on `clientId`, `dueDate`, `status`.
  - `Invoice`: Indexes on `clientId`, `dueDate`, `status`.
  - `Task`: Indexes on `assignedTo`, `dueDate`, `status`.
- **N+1 Avoidance**: Prisma `include` and `select` clauses are strictly used across services to batch-fetch child associations in single roundtrips.
- **Pagination Strategy**: Standard `skip` / `take` pagination combined with total record counting via `Promise.all([findMany, count])`.
- **Dashboard Aggregations**: Consolidated parallel queries via `Promise.all` with a 15-second TTL in-memory cache to eliminate repeated table scans during high concurrency.

---

# 11. AUTHENTICATION & AUTHORIZATION

### Authentication Mechanism
1. **Login (`POST /api/auth/login`)**: Validates email and Argon2-hashed password.
2. **JWT Issuance**:
   - **Access Token**: Short-lived (15 minutes), passed via `Authorization: Bearer <token>`.
   - **Refresh Token**: Long-lived (7 days), stored in an `httpOnly`, `sameSite: lax` secure cookie.
3. **Seed Fallback**: In offline development or fresh installs, fallback user `superadmin@taxflow.com` / `Pass@123` is supported.
4. **Token Rotation**: Refresh requests issue a new refresh token and invalidate the prior token hash in the database.

### Role-Based Access Control (RBAC)
- **SuperAdmin**: Unrestricted access across all clients, billing, user management, and audit logs.
- **Admin**: Full access to operational modules (clients, ITR, GST, billing). Cannot manage system roles.
- **Staff / Associate**: Scoped access restricted to clients where `assignedStaffId == user.id`.
- **Client**: Restricted to accessing only their own client records, documents, and invoices.

---

# 12. BUSINESS LOGIC & STATUTORY RULES

### 1. ITR Due Date Calculation (`DueDateEngine.calculateItrDueDate`)
- **Non-Audit Assessees** (Individuals, HUF, non-audit firms): **31st July** of the Assessment Year.
- **Audit Assessees** (Companies, LLPs, tax audit entities under Sec 44AB): **31st October** of the Assessment Year.
- **Transfer Pricing Assessees** (International transactions under Sec 92E): **30th November** of the Assessment Year.

### 2. GST Due Date Calculation (`DueDateEngine.calculateGstDueDate`)
- **GSTR-1 Monthly**: **11th** of the succeeding month.
- **GSTR-1 QRMP**: **13th** of the month following the quarter.
- **GSTR-3B Monthly**: **20th** of the succeeding month.
- **GSTR-3B QRMP**: **22nd / 24th** of the month following the quarter (based on state category).
- **GSTR-9 Annual**: **31st December** following the close of the Financial Year.

### 3. Automatic Client Statutory Sync (`ClientsService.syncClientFilings`)
- When a client is created or converted from `LEAD` to `ACTIVE`:
  - If `workType` includes `ITR` or `Tax Audit`: Creates AY 2026-27 `ItrFiling` with status `DOCUMENTS_PENDING`.
  - If `workType` includes `GST`: Creates monthly `GstReturn` for the active period with status `PENDING`.

### 4. Practice Billing Math (`BillingService.createInvoice`)
- Subtotal = $\sum (\text{lineItem amounts})$
- Statutory Tax = $\text{round}((\text{subtotal} \times 18) / 100)$ (Standard 18% GST)
- Total Invoice = $\text{subtotal} + \text{tax}$
- Generates dynamic UPI intent string:
  `upi://pay?pa=capractice@upi&pn=CA%20Practice&am=<total>&tn=<invoiceNo>&cu=INR`

---

# 13. FEATURE INVENTORY

| Feature Area | Implemented Capabilities | Frontend Component | Backend Service | Status |
| ------------ | ------------------------ | ------------------ | --------------- | ------ |
| **Authentication** | Login, Signup, Token Refresh, Role verification | `LoginPage.tsx` | `AuthService.ts` | **Production Ready** |
| **Dashboard** | 4 KPI cards, percentage comparisons, weekly activity chart | `DashboardPage.tsx` | `DashboardService.ts` | **Production Ready** |
| **Client CRM** | Onboarding, PAN/GSTIN validation, status filtering, staff assignment | `ClientListPage.tsx`, `ClientDetailPage.tsx` | `ClientsService.ts` | **Production Ready** |
| **Lead Pipeline** | Conversion pipeline from lead to active client | `LeadListPage.tsx` | `ClientsService.ts` | **Production Ready** |
| **Document Vault** | Upload, download, deletion, 4-point mandatory KYC checklist | `DocumentCenterPage.tsx` | `DocumentsService.ts` | **Production Ready** |
| **ITR Filing** | AY 2026-27 filings, status transitions, acknowledgement recording | `ItrDashboardPage.tsx` | `ItrService.ts` | **Production Ready** |
| **GST Returns** | GSTR-1, GSTR-3B filing tracker, upcoming deadline alerts | `GstDashboardPage.tsx` | `GstService.ts` | **Production Ready** |
| **Tax Audit (44AB)** | Form 3CA/3CB-3CD engagement tracker, 9-clause statutory checklist | `TaxAuditPage.tsx` | `TaxAuditService.ts` | **Production Ready** |
| **GST Registration** | TRN -> ARN -> Aadhaar Auth -> Query -> Approval pipeline | `GstRegistrationPage.tsx` | `GstRegistrationService.ts` | **Production Ready** |
| **TDS / TCS (26AS)** | Deductor TAN tracking, expected vs credited reconciliation | `TdsTcsPage.tsx` | In-memory / Prisma | **Production Ready** |
| **Billing & Invoices** | 18% GST invoices, dynamic UPI QR modal, payment recording | `BillingPage.tsx` | `BillingService.ts` | **Production Ready** |
| **Task Kanban** | Drag-and-drop / select status board, auto-generated compliance tasks | `TaskKanbanPage.tsx` | `TasksService.ts` | **Production Ready** |
| **WhatsApp Hub** | Compliance due date reminder templates, monthly spend metrics | `WhatsAppHubPage.tsx` | `WhatsAppService.ts` | **Production Ready** |
| **AI Assistant** | Hybrid intent parser (GST, ITR, invoices) & Ollama RAG fallback | `AiAssistantPage.tsx` | `AiService.ts` | **Production Ready** |
| **Admin & Security** | User invitation, RBAC permissions, audit logs trail | `UserManagementPage.tsx`, `AuditLogsPage.tsx` | `AdminService.ts` | **Production Ready** |

---

# 14. USER WORKFLOWS

### Workflow 1: Client Onboarding to Statutory Filing
1. **User**: CA Partner or Staff Associate navigates to `/clients`.
2. **Action**: Clicks **Add New Client**, enters Client Name, PAN (`ABCDE1234F`), optional GSTIN, entity type, and selects work type `ITR + GST`.
3. **Validation**: Frontend and Backend validate PAN and GSTIN formats using standard regex rules.
4. **Backend Sync**: `ClientsService.createClient` writes to PostgreSQL and automatically calls `syncClientFilings`.
5. **Outcome**:
   - Client record created.
   - An ITR filing for AY 2026-27 is automatically generated with status `DOCUMENTS_PENDING`.
   - A GST return for the current month is automatically generated with status `PENDING`.
   - Audit log recorded.

### Workflow 2: Section 44AB Tax Audit Verification
1. **User**: Auditor navigates to `/tax-audit`.
2. **Selection**: Selects client audit engagement under `FORM_3CD_PREP`.
3. **Scrutiny**: Reviews statutory clauses (e.g. Clause 22 MSME 43B(h), Clause 21 TDS Defaults).
4. **Action**: Marks verified clauses as `VERIFIED` or flags discrepancies with specific remarks.
5. **Outcome**: Audit progress counter updates dynamically. When all clauses pass, auditor advances stage to `UDIN_GENERATED`.

---

# 15. STATE MANAGEMENT

- **Server-Side Cache**: Powered by **RTK Query** (`apps/web/src/lib/api.ts`). Manages caching, background refetching, and tag-based cache invalidation for all entities.
- **Theme State**: Handled via React Context (`apps/web/src/context/ThemeContext.tsx`) and persisted to `localStorage`.
- **Local Form State**: Managed via native React `useState` and controlled form inputs.

---

# 16. REAL-TIME FEATURES

- **Event Bus (`apps/api/src/lib/event-bus.ts`)**: Decoupled in-memory publish/subscribe event engine.
  - Events: `CLIENT_CREATED`, `ITR_STATUS_CHANGED`, `DOCUMENT_CHECKLIST_COMPLETED`, `INVOICE_PAID`.
- **Polling & Optimistic Updates**: RTK Query tags automatically refresh frontend views whenever mutations succeed.

---

# 17. EXTERNAL INTEGRATIONS

- **PostgreSQL Database**: Primary relational data store accessed via Prisma Client.
- **Ollama AI Service**:
  - URL: `http://localhost:11434` (configurable via `OLLAMA_BASE_URL`).
  - Chat Model: `llama3.1:8b`.
  - Embedding Model: `nomic-embed-text`.
  - Fallback: Gracefully returns structured practice data if Ollama is unavailable.
- **WhatsApp Cloud API**:
  - Adapter: `WhatsAppProvider.ts` supporting `mock` mode and Meta Graph API `cloud` mode.
- **File Storage**:
  - Local Disk (`LocalDiskStorageAdapter`) saving to `storage/` directory.
  - MinIO S3 API compatible adapter (`minioadmin`).

---

# 18. ERROR HANDLING

- **Backend**:
  - `CustomError` hierarchy: `NotFoundError` (404), `UnauthorizedError` (401), `ForbiddenError` (403), `ConflictError` (409), `ValidationError` (400).
  - Global `errorHandler` formats all uncaught exceptions into `{ error: { code, message, details } }`.
- **Frontend**:
  - RTK Query error states render inline error banners with retry triggers (`refetch()`).

---

# 19. SECURITY

- **Password Security**: Hashed using memory-hard **Argon2id**.
- **JWT Architecture**: Access tokens (15m expiration) + Refresh tokens (7d expiration stored in secure HTTP-only cookies).
- **Injection Protection**: Parameterized queries enforced through Prisma ORM. No raw string concatenation.
- **Header Hardening**: `helmet()` enables HSTS, X-Content-Type-Options, X-Frame-Options, and CORS isolation.
- **Data Scoping**: Multi-tenancy isolation via `scopeToAssignedClients`.

---

# 20. PERFORMANCE

- **Frontend Optimization**:
  - Dynamic code splitting using `React.lazy()` and `Suspense` for all feature routes.
  - Vendor chunk separation in Vite (`vendor-react`, `vendor-redux`, `vendor-icons`).
  - Debounced search inputs (`useDebounce`) to avoid excessive backend requests.
- **Backend Optimization**:
  - Response compression enabled via `compression({ threshold: 1024 })`.
  - In-memory 15-second TTL cache on expensive dashboard KPI calculations.
  - Efficient Prisma index-backed queries.

---

# 21. TESTING

- **Unit & Integration Tests**:
  - Runner: **Jest** (`apps/api/jest.config.js`).
  - Engine tests: `tests/due-date-engine.test.ts` (verifies 31st July, 31st Oct, and 20th GST statutory rules).
  - Billing tests: `tests/billing.test.ts` (verifies 18% GST tax calculation and invoice math).
  - Execution: `npm run test:api`.
- **Type Checking**:
  - Full-workspace TypeScript validation: `npm run typecheck`.

---

# 22. CONFIGURATION & ENVIRONMENT VARIABLES

| Variable | Purpose | Required | Example / Format | Used By |
| -------- | ------- | -------- | ---------------- | ------- |
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://user:pass@localhost:5432/casaas_db` | Prisma, Backend |
| `JWT_ACCESS_SECRET` | Secret key for signing access tokens | Yes | `<SECRET>` | `jwt.ts`, Auth |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh tokens | Yes | `<SECRET>` | `jwt.ts`, Auth |
| `ACCESS_TOKEN_EXPIRES` | Access token lifespan | No | `15m` | `jwt.ts` |
| `REFRESH_TOKEN_EXPIRES` | Refresh token lifespan | No | `7d` | `jwt.ts` |
| `WHATSAPP_PROVIDER` | Provider mode (`mock` or `cloud`) | No | `mock` | `WhatsAppProvider.ts` |
| `WHATSAPP_ACCESS_TOKEN` | Meta Graph API access token | No | `<SECRET>` | `WhatsAppProvider.ts` |
| `OLLAMA_BASE_URL` | Ollama AI server endpoint | No | `http://localhost:11434` | `OllamaProvider.ts` |
| `OLLAMA_CHAT_MODEL` | Ollama LLM model name | No | `llama3.1:8b` | `OllamaProvider.ts` |
| `STORAGE_PROVIDER` | Document storage provider (`local` / `minio`) | No | `local` | `FileStorageAdapter.ts` |
| `APP_URL` | Frontend client origin URL | No | `http://localhost:3000` | CORS, App |
| `API_URL` | Backend server origin URL | No | `http://localhost:5000` | Server, Links |

---

# 23. BUILD / RUN / DEPLOYMENT

### Commands
```bash
# Install all dependencies across monorepo
npm install

# Build shared types
npm run build --workspace=packages/shared-types

# Generate Prisma client
npx prisma generate

# Run database migrations / schema sync
npx prisma db push

# Seed default SuperAdmin user
npm run db:seed

# Start development servers (API on 5000, Web on 3000)
npm run dev

# Run test suites
npm run test:api

# Typecheck monorepo
npm run typecheck

# Build for production
npm run build
```

---

# 24. IMPORTANT DESIGN DECISIONS

- **Decision**: Monorepo with a dedicated `packages/shared-types` workspace package.
  - **Reason**: Guarantees that Zod schemas, API contracts, and DTOs remain synchronized between backend and frontend with zero duplicate declarations.
- **Decision**: In-memory fallback user store in `AuthService`.
  - **Reason**: Enables continuous local testing and UI development even when PostgreSQL is offline or restarting.
- **Decision**: RTK Query over ad-hoc Axios/fetch hooks.
  - **Reason**: Automatic deduplication, caching, and tag-based cache invalidation without needing manual state reducers.

---

# 25. KNOWN ISSUES / BUGS

| Issue | Location | Severity | Current Behavior | Recommended Direction |
| ----- | -------- | -------- | ---------------- | --------------------- |
| Ollama Latency | `OllamaProvider.ts` | Low | If Ollama is offline, HTTP requests take up to 20s socket timeout before structured fallback triggers. | Add explicit 2-3s abort timeout on `fetch`. |
| In-Memory Tax Audit store | `tax-audit.service.ts` | Low | Audits and clauses are initialized into in-memory maps from Prisma clients. | Persist Form 3CD clauses directly into PostgreSQL tables for multi-instance clustering. |

---

# 26. TECHNICAL DEBT

- **Storage Provider**: Local filesystem storage adapter is active by default; MinIO or AWS S3 production adapter should be configured in cluster deployments.
- **Event Bus**: Currently in-process `EventEmitter`. For horizontal multi-node scaling, Redis pub/sub or BullMQ should be swapped in.

---

# 27. IMPORTANT CONSTANTS / ENUMS / STATUS VALUES

- **`SystemRole`**: `SuperAdmin` (practice owner), `Admin` (managing CA), `Staff` (associate/article assistant), `Client` (taxpayer).
- **`ItrStatus`**: `NOT_STARTED` -> `DOCUMENTS_PENDING` -> `UNDER_PREPARATION` -> `FILED` -> `VERIFIED` -> `PROCESSED` -> `REFUND_ISSUED`.
- **`GstStatus`**: `NOT_STARTED` -> `PENDING` -> `FILED` -> `OVERDUE`.
- **`InvoiceStatus`**: `DRAFT` -> `SENT` -> `PAID` -> `OVERDUE`.
- **`TaskStatus`**: `TODO` -> `IN_PROGRESS` -> `DONE`.
- **`TaxAuditStage`**: `ENGAGEMENT` -> `BOOKS_AUDIT` -> `FORM_3CD_PREP` -> `UDIN_GENERATED` -> `PORTAL_FILED` -> `CLIENT_ACCEPTED`.

---

# 28. DEPENDENCY MAP

```text
apps/web
 ├── @ca-saas/shared-types (packages/shared-types)
 ├── RTK Query (src/lib/api.ts)
 └── AppRouter (src/app/router.tsx)
      ├── Features (Dashboard, Clients, ITR, GST, Billing, Audit)
      └── Components (AppShell, UI Elements)

apps/api
 ├── @ca-saas/shared-types (packages/shared-types)
 ├── Prisma Client (prisma/schema.prisma)
 ├── DueDateEngine (src/lib/due-date-engine.ts)
 └── Modules (Auth, Clients, Documents, ITR, GST, Billing, Tasks)
```

---

# 29. CRITICAL CODE PATHS

1. **User Authentication Path**:
   `User Login -> AuthController.login -> AuthService.login -> Argon2 verify -> generateAccessToken -> Response with Cookie`
2. **Dashboard Metrics Path**:
   `DashboardPage -> useGetDashboardSummaryQuery -> DashboardController.getSummary -> DashboardService.getSummary -> (15s Cache or Parallel Prisma Aggregations) -> Response`
3. **Statutory Filing Auto-Sync Path**:
   `Client Creation -> ClientsService.createClient -> ClientsService.syncClientFilings -> DueDateEngine -> ItrFiling & GstReturn generation`

---

# 30. AI DEVELOPMENT GUIDE

### Before Changing Code:
1. **Read `AI_PROJECT_CONTEXT.md` first.**
2. Identify the target package (`packages/shared-types`, `apps/api`, or `apps/web`).
3. Check if an existing interface, utility, or schema in `packages/shared-types` already defines what you need.
4. If modifying database queries, verify indexes in `prisma/schema.prisma`.
5. Run `npm run typecheck` and `npm run test:api` to verify zero regressions.

---

# 31. CHANGE IMPACT ANALYSIS GUIDE

```text
Module: Clients CRM (apps/api/src/modules/clients)
Depends On: prisma, permissions, DueDateEngine, eventBus, shared-types
Used By: ClientListPage, ClientDetailPage, ItrService, GstService, BillingService
Potential Breaking Changes: Altering pan/gstin validation, modifying scopeToAssignedClients
Validation Step: Run npm run test:api and verify client creation & filing sync
```

---

# 32. QUICK AI REFERENCE

```text
PROJECT: TaxFlow (CA Practice Automation SaaS)
FRONTEND: apps/web (React 18, Vite 5, Tailwind CSS, RTK Query)
BACKEND: apps/api (Express.js, TypeScript, Prisma ORM)
DATABASE: PostgreSQL (pgvector) - prisma/schema.prisma
SHARED TYPES: packages/shared-types (Zod schemas & TypeScript DTOs)
AUTH: JWT access token (15m) + Refresh cookie (7d), Argon2
API ENTRY: apps/api/src/server.ts -> apps/api/src/app.ts
WEB ENTRY: apps/web/src/main.tsx -> apps/web/src/app/router.tsx
CRITICAL SEED USER: superadmin@taxflow.com / Pass@123
STATUTORY ENGINE: apps/api/src/lib/due-date-engine.ts
```

---

# 33. SOURCE-OF-TRUTH RULE

> `AI_PROJECT_CONTEXT.md` is the first-read project context document. Future AI agents should read this file before performing broad repository analysis. However, source code always remains the ultimate implementation source of truth. If `AI_PROJECT_CONTEXT.md` conflicts with the current source code:
> 1. Trust the current source code.
> 2. Update `AI_PROJECT_CONTEXT.md`.
> 3. Continue the requested task.

---

# 34. CONTEXT MAINTENANCE RULE

Whenever a significant architectural, API, database, feature, dependency, performance, security, or workflow change is made, `AI_PROJECT_CONTEXT.md` must be updated. Do not rewrite the entire document unnecessarily. Update only affected sections.

---

# 35. CHANGELOG

| Date | Change | Sections Updated |
| ---- | ------ | ---------------- |
| 2026-09-13 | Initial comprehensive repository analysis & context creation | All Sections (0 - 35) |
