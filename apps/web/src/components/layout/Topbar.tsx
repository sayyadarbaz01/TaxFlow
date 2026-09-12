import React, { useState } from "react";
import { Search, Bell, Bot, LogOut, User, Command } from "lucide-react";
import { AuthUser } from "@ca-saas/shared-types";
import { Button } from "../ui/Button";

export interface TopbarProps {
  user: AuthUser | null;
  onLogout: () => void;
  onOpenCmdK: () => void;
  onOpenNotificationDrawer: () => void;
  onOpenAi: () => void;
}

export const Topbar: React.FC<TopbarProps> = React.memo(({
  user,
  onLogout,
  onOpenCmdK,
  onOpenNotificationDrawer,
  onOpenAi
}) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10 shadow-2xs">
      {/* Search Input Trigger */}
      <div className="flex items-center space-x-4 flex-1 max-w-md">
        <button
          onClick={onOpenCmdK}
          className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition-smooth"
        >
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-slate-400" />
            <span>Search clients, PAN, GSTIN, invoices...</span>
          </div>
          <div className="flex items-center space-x-0.5 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-500 shadow-2xs">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Right Actions & Menu */}
      <div className="flex items-center space-x-3">
        {/* Ask AI Trigger */}
        <Button
          onClick={onOpenAi}
          variant="outline"
          size="sm"
          leftIcon={<Bot className="w-4 h-4 text-blue-600" />}
          className="text-blue-700 bg-blue-50/50 border-blue-200 hover:bg-blue-100/60"
        >
          Ask AI
        </Button>

        {/* Notifications */}
        <button
          onClick={onOpenNotificationDrawer}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 relative transition-smooth"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white"></span>
        </button>

        {/* User Profile Menu */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100 transition-smooth"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user.name.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-slate-900 leading-none">{user.name}</p>
                <p className="text-[10px] text-slate-500 capitalize mt-0.5">{user.role}</p>
              </div>
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{user.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-smooth font-medium"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
});
