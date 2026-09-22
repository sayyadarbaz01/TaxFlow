import React from "react";
import { cn } from "../../lib/cn";
import { Card } from "./Card";

export interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  trend?: string;
  trendTone?: "positive" | "negative" | "neutral";
  className?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  hint,
  icon,
  trend,
  trendTone = "neutral",
  className,
  onClick
}) => {
  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        onClick && "cursor-pointer hover:border-primary/40 hover:shadow-xs transition-smooth",
        className
      )}
      padding="md"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-xl font-bold tracking-tight text-foreground tabular-nums truncate">
            {value}
          </p>
          {(hint || trend) && (
            <p
              className={cn(
                "text-2xs font-medium",
                trendTone === "positive" && "text-emerald-600 dark:text-emerald-400",
                trendTone === "negative" && "text-rose-600 dark:text-rose-400",
                trendTone === "neutral" && "text-muted-foreground"
              )}
            >
              {trend || hint}
            </p>
          )}
        </div>
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-primary-muted text-primary flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};
