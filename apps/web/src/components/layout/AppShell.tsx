import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
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
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isCmdKOpen, setIsCmdKOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-close mobile navigation drawer on route change
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Mobile Drawer Backdrop Overlay */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* Responsive Sidebar (Off-canvas drawer on mobile, sticky sidebar on desktop) */}
      <Sidebar
        user={user}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Topbar
          user={user}
          onLogout={onLogout}
          onOpenCmdK={() => setIsCmdKOpen(true)}
          onOpenNotificationDrawer={() => setIsNotificationsOpen(true)}
          onOpenAi={() => navigate("/ai-assistant")}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
        />

        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto overflow-x-hidden w-full">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
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
