# CA Practice Automation SaaS (`ca-saas`)

An enterprise full-stack **CA Practice Automation SaaS** built with TypeScript, React 18, Vite, Express.js, Prisma ORM, PostgreSQL, Google Gemini AI, WhatsApp Cloud/Mock provider, and Docker Compose.

---

## 🌟 Architecture & Features Summary

1. **Authentication & Granular RBAC**:
   - Invite-only user registration.
   - Argon2 password hashing.
   - 15-minute JWT access tokens + HTTP-only 7-day rotating refresh tokens with reuse detection.
   - Role-Permission matrix (`Owner`, `Manager`, `Staff`, `Client`).

2. **Staff Row-Level Security (RLS)**:
   - Staff users are automatically scoped to query only clients explicitly assigned to them (`scopeToAssignedClients`).

3. **Statutory Due-Date Calculation Engines**:
   - Data-driven **ITR Engine**: AY 2026-27 rules (31 July non-audit, 31 Oct tax audit, 30 Nov transfer pricing, 31 Dec belated/revised).
   - Data-driven **GST Engine**: GSTR-1 (11th/13th), GSTR-3B (20th/22nd/24th), PMT-06 (25th), GSTR-9 (31 Dec).

4. **Idempotent Automation Event Bus**:
   - Subscribes to events like `CLIENT_CREATED`, `DOCUMENT_CHECKLIST_COMPLETED`, `INVOICE_OVERDUE`.
   - Auto-generates statutory filings, document checklists, task items, and WhatsApp alerts without duplicates.

5. **WhatsApp Integration**:
   - Configurable adapter (`WHATSAPP_PROVIDER=mock` or `cloud`).
   - Spend tracking (`GET /whatsapp/spend/monthly`).
   - Inbound webhook (`POST /webhooks/whatsapp`) auto-attaching incoming media to clients matched by phone number.

6. **Billing & Deep-Link UPI QR Collection**:
   - Line items, subtotal, 18% auto-tax calculation, deep-link UPI link generator (`upi://pay?pa=...`), QR code display modal, and 1-click payment marking.

7. **AI Tax Assistant (Gemini)**:
   - Backend-only `GEMINI_API_KEY` with Google Search grounding for current tax info.
   - RBAC-scoped practice context (clients, filings, documents, tasks, invoices).
   - Structured intents for GST/ITR/docs/billing plus modular `GeminiProvider` adapter.

8. **Enterprise Frontend UI/UX (`apps/web`)**:
   - High-density SaaS application shell with collapsible grouped sidebar.
   - Global Cmd+K quick search modal, Notification Drawer, Ask TaxFlow AI trigger.
   - 5-step Client Onboarding Wizard.
   - ITR visual status stepper (`Not Started -> Documents Pending -> Under Preparation -> Filed -> Verified -> Processed -> Refund Issued`).
   - Recurring GST return calendar.
   - TDS/TCS reconciliation matrix with mismatch badges.
   - Drag-and-drop task Kanban board (TO DO, IN PROGRESS, DONE).
   - Role-permission grid editor and expandable JSON audit log diff viewer.

---

## 🔑 Development Seed Credentials

The database seed provides pre-created development accounts (Password: `Password123!`):

| Role | Email | Scope |
|---|---|---|
| **SuperAdmin** | `superadmin@taxflow.com` | Full Administrative & Operational Access (User Management, Audit Logs, All Modules) |
| **Admin** | `admin@taxflow.com` | Practice Operational Access (Clients, Documents, ITR, GST, TDS/TCS, Tasks, Billing, WhatsApp, AI) |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 20 LTS or higher
- npm 10+
- PostgreSQL 16+ (with `pgvector` extension) or Docker

### 1. Environment Setup
Copy the environment template:
```bash
cp .env.example .env
```

### 2. Install Monorepo Dependencies
```bash
npm install
```

### 3. Database Migration & Seeding
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 4. Running Local Development Server
Start both Frontend (`apps/web`) and Backend (`apps/api`) concurrently:
```bash
npm run dev
```
- **Frontend App**: `http://localhost:3000` (or `http://localhost:5173`)
- **Backend API**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/health`

---

## 🐳 Docker Deployment

Run all services (Postgres, MinIO, API, Web) using Docker Compose:

```bash
docker-compose up -d --build
```

---

## 🧪 Testing Matrix

```bash
# Typecheck all packages
npm run typecheck

# Run Backend Unit & Integration Tests (Jest)
npm run test:api

# Run Playwright E2E Tests
npm run test:e2e
```
