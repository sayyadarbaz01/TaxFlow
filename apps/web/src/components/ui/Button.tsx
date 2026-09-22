import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  leftIcon,
  rightIcon,
  className,
  ...props
}) => {
  const variants = {
    primary:
      "bg-primary text-primary-foreground hover:opacity-90 focus-visible:ring-ring shadow-xs",
    secondary:
      "bg-muted text-foreground hover:bg-muted/80 focus-visible:ring-ring",
    danger:
      "bg-destructive text-destructive-foreground hover:opacity-90 focus-visible:ring-destructive shadow-xs",
    success:
      "bg-success text-success-foreground hover:opacity-90 focus-visible:ring-success shadow-xs",
    outline:
      "border border-border bg-card text-foreground hover:bg-muted focus-visible:ring-ring shadow-xs",
    ghost: "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring"
  };

  const sizes = {
    sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
    md: "h-9 px-4 text-sm gap-2 rounded-lg",
    lg: "h-11 px-5 text-sm gap-2.5 rounded-xl"
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-smooth focus-ring disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : leftIcon}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
