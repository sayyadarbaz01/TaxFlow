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
  FileBadge
} from "lucide-react";
import { clsx } from "clsx";
import { AuthUser } from "@ca-saas/shared-types";

export interface SidebarProps {
  user: AuthUser | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = React.memo(({ user, isCollapsed, onToggleCollapse }) => {
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
        "bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-smooth relative z-20 h-screen sticky top-0",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        {!isCollapsed ? (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
              CA
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight leading-none">CA SaaS</h1>
              <p className="text-[10px] text-slate-400 font-medium">Practice Automation</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 mx-auto rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            CA
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-smooth hidden md:block"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Grouped Nav Items */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {groups.map((group, gIdx) => {
          const visibleItems = group.items.filter(item => canAccess((item as any).superAdminOnly));
          if (visibleItems.length === 0) return null;

          return (
            <div key={gIdx} className="space-y-1">
              {!isCollapsed && (
                <h2 className="px-3 text-[10px] font-semibold text-slate-400 tracking-wider uppercase mb-1">
                  {group.title}
                </h2>
              )}
              {visibleItems.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      clsx(
                        "flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-smooth group",
                        isActive
                          ? "bg-blue-600 text-white font-semibold shadow-xs"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      )
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!isCollapsed && <span className="ml-3 truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* User Info Footer */}
      {user && !isCollapsed && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate">
            <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-white truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
});
