import React from "react";
import { cn } from "../../lib/cn";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = {
  none: "p-0",
  sm: "p-3 sm:p-4",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-6"
};

export const Card: React.FC<CardProps> = React.memo(
  ({ children, className, onClick, padding = "md" }) => {
    return (
      <div
        onClick={onClick}
        className={cn(
          "surface-card transition-smooth",
          paddingMap[padding],
          onClick && "cursor-pointer hover:border-primary/30 hover:shadow-card",
          className
        )}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
