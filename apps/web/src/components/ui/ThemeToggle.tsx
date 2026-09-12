import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { clsx } from "clsx";

export interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className, size = "md", showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={clsx(
        "rounded-lg border transition-smooth focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs flex items-center gap-2 relative group",
        theme === "dark"
          ? "border-slate-700 bg-slate-850 text-amber-400 hover:bg-slate-800"
          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
        size === "sm" ? "px-2.5 py-1 text-xs" : "p-2",
        className
      )}
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className={clsx(size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4", "text-amber-400 animate-in spin-in-180 duration-200 flex-shrink-0")} />
      ) : (
        <Moon className={clsx(size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4", "text-slate-600 animate-in spin-in-180 duration-200 flex-shrink-0")} />
      )}
      {showLabel && (
        <span className="text-xs font-semibold capitalize">
          {theme === "dark" ? "Dark" : "Light"}
        </span>
      )}
    </button>
  );
};

