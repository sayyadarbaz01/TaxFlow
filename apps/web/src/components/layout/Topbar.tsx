import React, { useState } from "react";
import { Search, Bell, Bot, LogOut, Command, Menu } from "lucide-react";
import { AuthUser } from "@ca-saas/shared-types";
import { Button } from "../ui/Button";
import { ThemeToggle } from "../ui/ThemeToggle";

export interface TopbarProps {
  user: AuthUser | null;
  onLogout: () => void;
  onOpenCmdK: () => void;
  onOpenNotificationDrawer: () => void;
  onOpenAi: () => void;
  onOpenMobileNav?: () => void;
}

export const Topbar: React.FC<TopbarProps> = React.memo(({
  user,
  onLogout,
  onOpenCmdK,
  onOpenNotificationDrawer,
  onOpenAi,
  onOpenMobileNav
}) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  return (
    <header className="h-16 flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-10 shadow-2xs transition-colors duration-200">
      {/* Left side: Mobile menu toggle + Search Input Trigger */}
      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 max-w-md">
        <button
          onClick={onOpenMobileNav}
          className="p-2 -ml-1 sm:ml-0 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-smooth"
          title="Open navigation menu"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenCmdK}
          className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-400 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-smooth"
        >
          <div className="flex items-center space-x-2 truncate">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="truncate">Search clients, PAN, GSTIN...</span>
          </div>
          <div className="hidden sm:flex items-center space-x-0.5 px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[10px] font-mono text-slate-500 dark:text-slate-300 shadow-2xs">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Right Actions & Menu */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3">
        {/* Ask AI Trigger */}
        <Button
          onClick={onOpenAi}
          variant="outline"
          size="sm"
          leftIcon={<Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
          className="hidden md:inline-flex text-blue-700 dark:text-blue-300 bg-blue-50/60 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 hover:bg-blue-100/70 dark:hover:bg-blue-900/50"
        >
          Ask TaxFlow AI
        </Button>

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Notifications */}
        <button
          onClick={onOpenNotificationDrawer}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-smooth"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900"></span>
        </button>

        {/* User Profile Menu */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-smooth"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user.name.charAt(0)}
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-semibold text-slate-900 dark:text-white leading-none">{user.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize mt-0.5">{user.role}</p>
              </div>
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{user.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-smooth font-medium"
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

