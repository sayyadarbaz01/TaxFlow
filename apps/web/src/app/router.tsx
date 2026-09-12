import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { LandingPage } from "../features/landing/LandingPage";
import { LoginPage } from "../features/auth/LoginPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { ClientListPage } from "../features/clients/ClientListPage";
import { LeadListPage } from "../features/clients/LeadListPage";
import { ClientDetailPage } from "../features/clients/ClientDetailPage";
import { ItrDashboardPage } from "../features/itr/ItrDashboardPage";
import { GstDashboardPage } from "../features/gst/GstDashboardPage";
import { DocumentCenterPage } from "../features/documents/DocumentCenterPage";
import { TdsTcsPage } from "../features/tds-tcs/TdsTcsPage";
import { TaxAuditPage } from "../features/tax-audit/TaxAuditPage";
import { GstRegistrationPage } from "../features/gst-registration/GstRegistrationPage";
import { BillingPage } from "../features/billing/BillingPage";
import { TaskKanbanPage } from "../features/tasks/TaskKanbanPage";
import { WhatsAppHubPage } from "../features/whatsapp/WhatsAppHubPage";
import { AiAssistantPage } from "../features/ai-assistant/AiAssistantPage";
import { UserManagementPage } from "../features/admin/UserManagementPage";
import { AuditLogsPage } from "../features/admin/AuditLogsPage";
import { AuthUser } from "@ca-saas/shared-types";

export interface AppRouterProps {
  user: AuthUser | null;
  onLoginSuccess: (user: AuthUser, token: string) => void;
  onLogout: () => void;
}

export const AppRouter: React.FC<AppRouterProps> = ({ user, onLoginSuccess, onLogout }) => {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth Login & Signup Pages */}
      <Route
        path="/login"
        element={!user ? <LoginPage initialMode="login" onLoginSuccess={onLoginSuccess} /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/signup"
        element={!user ? <LoginPage initialMode="signup" onLoginSuccess={onLoginSuccess} /> : <Navigate to="/dashboard" replace />}
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

          <Route path="/admin/users" element={user.role === "SuperAdmin" ? <UserManagementPage /> : <Navigate to="/dashboard" replace />} />
          <Route path="/admin/audit-logs" element={user.role === "SuperAdmin" ? <AuditLogsPage /> : <Navigate to="/dashboard" replace />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
};
