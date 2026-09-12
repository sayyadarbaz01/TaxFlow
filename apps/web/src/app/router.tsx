import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { PageLoader } from "../components/ui/PageLoader";
import { AuthUser } from "@ca-saas/shared-types";

// Lazy-loaded routes for optimal bundle splitting (<100ms loading)
const LandingPage = lazy(() =>
  import("../features/landing/LandingPage").then((m) => ({ default: m.LandingPage }))
);
const LoginPage = lazy(() =>
  import("../features/auth/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const DashboardPage = lazy(() =>
  import("../features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);
const ClientListPage = lazy(() =>
  import("../features/clients/ClientListPage").then((m) => ({ default: m.ClientListPage }))
);
const LeadListPage = lazy(() =>
  import("../features/clients/LeadListPage").then((m) => ({ default: m.LeadListPage }))
);
const ClientDetailPage = lazy(() =>
  import("../features/clients/ClientDetailPage").then((m) => ({ default: m.ClientDetailPage }))
);
const ItrDashboardPage = lazy(() =>
  import("../features/itr/ItrDashboardPage").then((m) => ({ default: m.ItrDashboardPage }))
);
const GstDashboardPage = lazy(() =>
  import("../features/gst/GstDashboardPage").then((m) => ({ default: m.GstDashboardPage }))
);
const DocumentCenterPage = lazy(() =>
  import("../features/documents/DocumentCenterPage").then((m) => ({ default: m.DocumentCenterPage }))
);
const TdsTcsPage = lazy(() =>
  import("../features/tds-tcs/TdsTcsPage").then((m) => ({ default: m.TdsTcsPage }))
);
const TaxAuditPage = lazy(() =>
  import("../features/tax-audit/TaxAuditPage").then((m) => ({ default: m.TaxAuditPage }))
);
const GstRegistrationPage = lazy(() =>
  import("../features/gst-registration/GstRegistrationPage").then((m) => ({
    default: m.GstRegistrationPage
  }))
);
const BillingPage = lazy(() =>
  import("../features/billing/BillingPage").then((m) => ({ default: m.BillingPage }))
);
const TaskKanbanPage = lazy(() =>
  import("../features/tasks/TaskKanbanPage").then((m) => ({ default: m.TaskKanbanPage }))
);
const WhatsAppHubPage = lazy(() =>
  import("../features/whatsapp/WhatsAppHubPage").then((m) => ({ default: m.WhatsAppHubPage }))
);
const AiAssistantPage = lazy(() =>
  import("../features/ai-assistant/AiAssistantPage").then((m) => ({ default: m.AiAssistantPage }))
);
const UserManagementPage = lazy(() =>
  import("../features/admin/UserManagementPage").then((m) => ({ default: m.UserManagementPage }))
);
const AuditLogsPage = lazy(() =>
  import("../features/admin/AuditLogsPage").then((m) => ({ default: m.AuditLogsPage }))
);

export interface AppRouterProps {
  user: AuthUser | null;
  onLoginSuccess: (user: AuthUser, token: string) => void;
  onLogout: () => void;
}

export const AppRouter: React.FC<AppRouterProps> = ({ user, onLoginSuccess, onLogout }) => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth Login & Signup Pages */}
        <Route
          path="/login"
          element={
            !user ? (
              <LoginPage initialMode="login" onLoginSuccess={onLoginSuccess} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/signup"
          element={
            !user ? (
              <LoginPage initialMode="signup" onLoginSuccess={onLoginSuccess} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />

        {/* Protected App Routes */}
        {user ? (
          <Route element={<AppShell user={user} onLogout={onLogout} />}>
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route path="/clients" element={<ClientListPage />} />
            <Route path="/clients/:id" element={<ClientDetailPage />} />
            <Route path="/leads" element={<LeadListPage />} />

            <Route path="/documents" element={<DocumentCenterPage />} />
            <Route path="/itr" element={<ItrDashboardPage />} />
            <Route path="/gst" element={<GstDashboardPage />} />
            <Route path="/tax-audit" element={<TaxAuditPage />} />
            <Route path="/gst-registration" element={<GstRegistrationPage />} />
            <Route path="/tds-tcs" element={<TdsTcsPage />} />

            <Route path="/tasks" element={<TaskKanbanPage />} />
            <Route path="/whatsapp" element={<WhatsAppHubPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/ai-assistant" element={<AiAssistantPage />} />

            <Route
              path="/admin/users"
              element={
                user.role === "SuperAdmin" ? (
                  <UserManagementPage />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                user.role === "SuperAdmin" ? (
                  <AuditLogsPage />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Suspense>
  );
};
