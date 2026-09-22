import React, { useEffect, useRef, useState } from "react";
import { Search, Bell, Bot, LogOut, Command, Menu } from "lucide-react";
import { AuthUser } from "@ca-saas/shared-types";
import { Button } from "../ui/Button";
import { ThemeToggle } from "../ui/ThemeToggle";
import { cn } from "../../lib/cn";

export interface TopbarProps {
  user: AuthUser | null;
  onLogout: () => void;
  onOpenCmdK: () => void;
  onOpenNotificationDrawer: () => void;
  onOpenAi: () => void;
  onOpenMobileNav?: () => void;
}

export const Topbar: React.FC<TopbarProps> = React.memo(
  ({ user, onLogout, onOpenCmdK, onOpenNotificationDrawer, onOpenAi, onOpenMobileNav }) => {
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const onDocClick = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          setShowProfileDropdown(false);
        }
      };
      if (showProfileDropdown) document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }, [showProfileDropdown]);

    return (
      <header className="h-16 flex-shrink-0 bg-card/80 backdrop-blur-md border-b border-border px-3 sm:px-5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-lg">
          <button
            onClick={onOpenMobileNav}
            className="p-2 -ml-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted lg:hidden transition-smooth focus-ring"
            title="Open navigation"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={onOpenCmdK}
            className="w-full flex items-center justify-between h-9 px-3 text-xs text-muted-foreground bg-muted/50 border border-border rounded-lg hover:border-primary/30 hover:bg-muted transition-smooth focus-ring"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Search clients, PAN, GSTIN…</span>
            </div>
            <div className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-card border border-border rounded text-2xs font-mono text-muted-foreground">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 ml-2">
          <Button
            onClick={onOpenAi}
            variant="outline"
            size="sm"
            leftIcon={<Bot className="w-3.5 h-3.5 text-primary" />}
            className="hidden md:inline-flex border-primary/20 bg-primary-muted/50 text-primary hover:bg-primary-muted"
          >
            Ask TaxFlow AI
          </Button>

          <ThemeToggle />

          <button
            onClick={onOpenNotificationDrawer}
            className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth focus-ring"
            title="Notifications"
          >
            <Bell className="w-4.5 h-4.5 w-[18px] h-[18px]" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary ring-2 ring-card" />
          </button>

          {user && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowProfileDropdown((v) => !v)}
                className={cn(
                  "flex items-center gap-2 p-1 rounded-lg hover:bg-muted transition-smooth focus-ring",
                  showProfileDropdown && "bg-muted"
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                  {user.name.charAt(0)}
                </div>
                <div className="text-left hidden lg:block pr-1">
                  <p className="text-xs font-semibold leading-none">{user.name}</p>
                  <p className="text-2xs text-muted-foreground capitalize mt-0.5">{user.role}</p>
                </div>
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-xl shadow-elevated py-1 z-30 animate-zoom-in-95">
                  <div className="px-3.5 py-2.5 border-b border-border">
                    <p className="text-xs font-semibold">{user.name}</p>
                    <p className="text-2xs text-muted-foreground truncate mt-0.5">{user.email}</p>
                  </div>
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center px-3.5 py-2 text-xs text-destructive hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-smooth font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-2" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>
    );
  }
);

Topbar.displayName = "Topbar";
