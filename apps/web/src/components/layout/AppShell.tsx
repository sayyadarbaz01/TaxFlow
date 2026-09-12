import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CmdKModal } from "./CmdKModal";
import { NotificationDrawer } from "./NotificationDrawer";
import { AuthUser } from "@ca-saas/shared-types";

export interface AppShellProps {
  user: AuthUser | null;
  onLogout: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({ user, onLogout }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCmdKOpen, setIsCmdKOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <Sidebar
        user={user}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          user={user}
          onLogout={onLogout}
          onOpenCmdK={() => setIsCmdKOpen(true)}
          onOpenNotificationDrawer={() => setIsNotificationsOpen(true)}
          onOpenAi={() => navigate("/ai-assistant")}
        />

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet context={{ user }} />
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <CmdKModal isOpen={isCmdKOpen} onClose={() => setIsCmdKOpen(false)} />
      <NotificationDrawer isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
    </div>
  );
};
