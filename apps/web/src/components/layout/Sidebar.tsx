import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FolderOpen,
  FileText,
  Calendar,
  Layers,
  CheckSquare,
  MessageSquare,
  CreditCard,
  Bot,
  ShieldCheck,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileBadge,
  X
} from "lucide-react";
import { clsx } from "clsx";
import { AuthUser } from "@ca-saas/shared-types";
import { ThemeToggle } from "../ui/ThemeToggle";

export interface SidebarProps {
  user: AuthUser | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = React.memo(
  ({ user, isCollapsed, onToggleCollapse, isMobileOpen = false, onCloseMobile }) => {
    const groups = [
      {
        title: "WORKSPACE",
        items: [
          { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
          { label: "Clients", icon: Users, path: "/clients", perm: "clients:read" },
          { label: "Lead Clients", icon: UserPlus, path: "/leads", perm: "clients:read" },
          { label: "Documents", icon: FolderOpen, path: "/documents", perm: "documents:read" }
        ]
      },
      {
        title: "COMPLIANCE",
        items: [
          { label: "ITR Filings", icon: FileText, path: "/itr", perm: "itr:read" },
          { label: "GST Returns", icon: Calendar, path: "/gst", perm: "gst:read" },
          { label: "Tax Audit", icon: ClipboardCheck, path: "/tax-audit", perm: "tax_audit:read" },
          { label: "GST Registration", icon: FileBadge, path: "/gst-registration", perm: "gst_registration:read" },
          { label: "TDS / TCS", icon: Layers, path: "/tds-tcs", perm: "tds_tcs:read" }
        ]
      },
      {
        title: "OPERATIONS",
        items: [
          { label: "Tasks", icon: CheckSquare, path: "/tasks", perm: "tasks:read" },
          { label: "WhatsApp Hub", icon: MessageSquare, path: "/whatsapp", perm: "whatsapp:read" }
        ]
      },
      {
        title: "FINANCE",
        items: [
          { label: "Billing & Invoices", icon: CreditCard, path: "/billing", perm: "billing:read" }
        ]
      },
      {
        title: "INTELLIGENCE",
        items: [
          { label: "AI Assistant", icon: Bot, path: "/ai-assistant", perm: "ai_assistant:read" }
        ]
      },
      {
        title: "ADMINISTRATION",
        items: [
          { label: "User Management", icon: ShieldCheck, path: "/admin/users", superAdminOnly: true },
          { label: "Audit Logs", icon: FileSpreadsheet, path: "/admin/audit-logs", superAdminOnly: true }
        ]
      }
    ];

    const canAccess = (superAdminOnly?: boolean) => {
      if (!user) return false;
      if (superAdminOnly) {
        return user.role === "SuperAdmin";
      }
      return true;
    };

    return (
      <aside
        className={clsx(
          "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 flex flex-col border-r border-slate-200 dark:border-slate-800 transition-colors duration-200 fixed inset-y-0 left-0 z-50 lg:relative lg:h-full lg:z-auto flex-shrink-0",
          isMobileOpen ? "translate-x-0 shadow-2xl w-64" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-16" : "lg:w-64"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          {!isCollapsed || isMobileOpen ? (
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                TF
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-none">TaxFlow</h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Tax & Audit Suite</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              TF
            </div>
          )}

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-smooth hidden lg:block"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-smooth lg:hidden"
            title="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grouped Nav Items */}
        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-5 touch-pan-y">
          {groups.map((group, gIdx) => {
            const visibleItems = group.items.filter((item) => canAccess((item as any).superAdminOnly));
            if (visibleItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-1">
                {(!isCollapsed || isMobileOpen) && (
                  <h2 className="px-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase mb-1">
                    {group.title}
                  </h2>
                )}
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => onCloseMobile?.()}
                      className={({ isActive }) =>
                        clsx(
                          "flex items-center px-3 py-2.5 lg:py-2 rounded-lg text-xs font-medium transition-smooth group",
                          isActive
                            ? "bg-blue-600 text-white font-semibold shadow-xs"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
                        )
                      }
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {(!isCollapsed || isMobileOpen) && (
                        <span className="ml-3 truncate">{item.label}</span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* User Info Footer + Theme Toggle */}
        {user && (!isCollapsed || isMobileOpen) && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-2 truncate">
              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 dark:bg-slate-700 dark:text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{user.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{user.role}</p>
              </div>
            </div>

            {/* Quick Theme Toggle inside footer for easy access */}
            <ThemeToggle size="sm" />
          </div>
        )}
      </aside>
    );
  }
);

