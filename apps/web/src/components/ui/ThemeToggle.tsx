import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { cn } from "../../lib/cn";

export interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className,
  size = "md",
  showLabel = false
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth focus-ring flex items-center gap-2",
        size === "sm" ? "h-7 px-2 text-xs" : "h-9 w-9 justify-center",
        className
      )}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className={cn(size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4")} />
      ) : (
        <Moon className={cn(size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4")} />
      )}
      {showLabel && (
        <span className="text-xs font-semibold capitalize">{theme === "dark" ? "Dark" : "Light"}</span>
      )}
    </button>
  );
};
