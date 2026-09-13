# CA Practice Dashboard KPI Cards Implementation

## Overview
Replaced generic CRM dashboard KPI cards with real-time Indian Chartered Accountant (CA) operational KPI metrics:
1. **Total Clients**
2. **ITR Pending**
3. **GST Returns Due**
4. **Outstanding Fees**

All metrics are computed via backend database aggregation with tenant/CA data isolation, supporting skeleton loading states, error handling with retry, clean empty states, and click-through deep-filtering.

---

## Architecture & Implementation Details

### 1. Shared Types (`packages/shared-types`)
- Defined `DashboardSummaryResponse` in `src/index.ts`:
  ```ts
  export interface DashboardSummaryResponse {
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
  ```

### 2. Backend Aggregation (`apps/api`)
- **[DashboardService](file:///c:/Users/MOHAMMED%20RN/Desktop/Tax-Automation/ca-saas/apps/api/src/modules/dashboard/dashboard.service.ts)**:
  - **Total Clients**: Scoped count of clients with `status: "ACTIVE"`. Excludes inactive, archived, and soft-deleted records. Calculates percentage change vs. prior month if historical data exists.
  - **ITR Pending**: Scoped count of ITR filings with workflow status in `["NOT_STARTED", "DOCUMENTS_PENDING", "UNDER_PREPARATION", "FILED"]`. Verified/Processed/Completed records are excluded. Overdue count tracked where `dueDate < today`.
  - **GST Returns Due**: Scoped count of returns with `status != "FILED"` and `dueDate <= today + 7 days` (or overdue). Overdue count tracked where `dueDate < today`.
  - **Outstanding Fees**: Invoices with `status in ["SENT", "OVERDUE", "DRAFT"]`. Calculated as `SUM(invoice.total) - SUM(successful payments)`. Overdue fees tracked where `dueDate < today`.
- **[Dashboard Routes](file:///c:/Users/MOHAMMED%20RN/Desktop/Tax-Automation/ca-saas/apps/api/src/modules/dashboard/dashboard.routes.ts)**:
  - `GET /dashboard/summary` (proxied via Vite `/api/dashboard/summary`) with `requireAuth`.
- **Filtered List Endpoints**:
  - `ClientsService.listClients`: Supports `query.status` filter (e.g. `status=ACTIVE`).
  - `ItrService.listFilings`: Supports `query.status=pending` (returns non-completed ITRs ordered by nearest due date).
  - `GstService.listReturns`: Supports `query.status=due` (returns returns due within 7 days or overdue, sorted by nearest due date).
  - `BillingService.listInvoices`: Supports `query.status=unpaid` (returns unpaid/partially paid invoices sorted with overdue first).

### 3. Frontend UI (`apps/web`)
- **[DashboardPage](file:///c:/Users/MOHAMMED%20RN/Desktop/Tax-Automation/ca-saas/apps/web/src/features/dashboard/DashboardPage.tsx)**:
  - Preserved existing layout, card dimensions, height, typography, and responsive grid (`1 col` mobile, `2x2` tablet, `4 cols` desktop).
  - **Loading State**: 4 animated skeleton loaders matching exact card dimensions.
  - **Error State**: Displays card error with inline `Retry` button calling `refetchSummary()`.
  - **Empty States**:
    - Total Clients: `0` / `"Active clients"`
    - ITR Pending: `0` / `"No pending ITR work"`
    - GST Returns Due: `0` / `"All returns on track"`
    - Outstanding Fees: `₹0` / `"No outstanding fees"`
  - **Secondary / Overdue Badges**:
    - ITR: Shows `• X overdue` in bold rose when overdue items exist.
    - GST: Shows `• X overdue` in bold rose when overdue items exist.
    - Fees: Shows `• ₹X overdue` when overdue balances exist.
  - **Click-Through Navigation**:
    - Total Clients → `/clients?status=ACTIVE`
    - ITR Pending → `/itr?status=pending`
    - GST Returns Due → `/gst?status=due`
    - Outstanding Fees → `/billing?status=unpaid`
- **Destination Pages Updated**:
  - [ClientListPage](file:///c:/Users/MOHAMMED%20RN/Desktop/Tax-Automation/ca-saas/apps/web/src/features/clients/ClientListPage.tsx): Reads `searchParams.get("status")` and applies status filter.
  - [ItrDashboardPage](file:///c:/Users/MOHAMMED%20RN/Desktop/Tax-Automation/ca-saas/apps/web/src/features/itr/ItrDashboardPage.tsx): Reads `searchParams.get("status")`, includes "Pending Actions" filter tab.
  - [GstDashboardPage](file:///c:/Users/MOHAMMED%20RN/Desktop/Tax-Automation/ca-saas/apps/web/src/features/gst/GstDashboardPage.tsx): Reads `searchParams.get("status")`, includes "Due / Approaching" filter tab.
  - [BillingPage](file:///c:/Users/MOHAMMED%20RN/Desktop/Tax-Automation/ca-saas/apps/web/src/features/billing/BillingPage.tsx): Reads `searchParams.get("status")`, includes "Unpaid / Overdue" filter tab.

---

## Validation & Test Results

Executed automated validation against the live PostgreSQL database:
- **Empty State**: Verified 0 active clients, 0 pending ITRs, 0 due GST returns, ₹0 fees.
- **Case 1 (Active Clients)**: Active clients counted (`1`), inactive clients ignored (`0`).
- **Cases 2 & 3 (ITR Pending & Overdue)**: Pending counted (`2`), overdue identified (`1`), verified/completed ignored (`1`).
- **Cases 4 & 5 (GST Returns Due & Overdue)**: Returns within 7 days and overdue counted (`2`), overdue identified (`1`), future (>7 days) and filed ignored.
- **Cases 6, 7 & 8 (Outstanding Fees)**:
  - Invoice ₹50,000 with ₹20,000 partial payment = ₹30,000 balance.
  - Invoice ₹25,000 overdue = ₹25,000 overdue balance.
  - Fully paid ₹10,000 invoice ignored.
  - Total Outstanding: ₹55,000 (Overdue: ₹25,000).
- **Full Monorepo Build**: All packages (`@ca-saas/shared-types`, `@ca-saas/api`, `@ca-saas/web`) built cleanly with zero errors.
