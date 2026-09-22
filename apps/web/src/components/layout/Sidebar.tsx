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
import { cn } from "../../lib/cn";
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
        title: "Workspace",
        items: [
          { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
          { label: "Clients", icon: Users, path: "/clients", perm: "clients:read" },
          { label: "Lead Clients", icon: UserPlus, path: "/leads", perm: "clients:read" },
          { label: "Documents", icon: FolderOpen, path: "/documents", perm: "documents:read" }
        ]
      },
      {
        title: "Compliance",
        items: [
          { label: "ITR Filings", icon: FileText, path: "/itr", perm: "itr:read" },
          { label: "GST Returns", icon: Calendar, path: "/gst", perm: "gst:read" },
          { label: "Tax Audit", icon: ClipboardCheck, path: "/tax-audit", perm: "tax_audit:read" },
          {
            label: "GST Registration",
            icon: FileBadge,
            path: "/gst-registration",
            perm: "gst_registration:read"
          },
          { label: "TDS / TCS", icon: Layers, path: "/tds-tcs", perm: "tds_tcs:read" }
        ]
      },
      {
        title: "Operations",
        items: [
          { label: "Tasks", icon: CheckSquare, path: "/tasks", perm: "tasks:read" },
          { label: "WhatsApp Hub", icon: MessageSquare, path: "/whatsapp", perm: "whatsapp:read" }
        ]
      },
      {
        title: "Finance",
        items: [
          { label: "Billing & Invoices", icon: CreditCard, path: "/billing", perm: "billing:read" }
        ]
      },
      {
        title: "Intelligence",
        items: [
          { label: "AI Tax Assistant", icon: Bot, path: "/ai-assistant", perm: "ai_assistant:read" }
        ]
      },
      {
        title: "Administration",
        items: [
          { label: "User Management", icon: ShieldCheck, path: "/admin/users", superAdminOnly: true },
          {
            label: "Audit Logs",
            icon: FileSpreadsheet,
            path: "/admin/audit-logs",
            superAdminOnly: true
          }
        ]
      }
    ];

    const canAccess = (superAdminOnly?: boolean) => {
      if (!user) return false;
      if (superAdminOnly) return user.role === "SuperAdmin";
      return true;
    };

    const showLabels = !isCollapsed || isMobileOpen;

    return (
      <aside
        className={cn(
          "bg-card text-foreground flex flex-col border-r border-border transition-all duration-200 fixed inset-y-0 left-0 z-50 lg:relative lg:h-full lg:z-auto flex-shrink-0",
          isMobileOpen ? "translate-x-0 shadow-elevated w-64" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-[4.5rem]" : "lg:w-64"
        )}
      >
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-border flex-shrink-0">
          {showLabels ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
                TF
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold tracking-tight leading-none truncate">TaxFlow</h1>
                <p className="text-2xs text-muted-foreground font-medium mt-0.5">Practice OS</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
              TF
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth hidden lg:inline-flex focus-ring"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth lg:hidden focus-ring"
            title="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-5 touch-pan-y">
          {groups.map((group, gIdx) => {
            const visibleItems = group.items.filter((item) =>
              canAccess((item as any).superAdminOnly)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-0.5">
                {showLabels && (
                  <h2 className="px-2.5 mb-1.5 text-2xs font-semibold text-muted-foreground tracking-wider uppercase">
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
                      title={!showLabels ? item.label : undefined}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center px-2.5 py-2 rounded-lg text-xs font-medium transition-smooth group",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )
                      }
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {showLabels && <span className="ml-2.5 truncate">{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {user && showLabels && (
          <div className="p-3 border-t border-border bg-muted/30 flex items-center justify-between flex-shrink-0 gap-2">
            <div className="flex items-center gap-2 truncate min-w-0">
              <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold truncate">{user.name}</p>
                <p className="text-2xs text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>
            <ThemeToggle size="sm" />
          </div>
        )}
      </aside>
    );
  }
);

Sidebar.displayName = "Sidebar";
