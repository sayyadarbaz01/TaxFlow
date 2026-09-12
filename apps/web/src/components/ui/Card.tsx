import React from "react";
import { clsx } from "clsx";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = React.memo(({ children, className, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "bg-white rounded-xl border border-slate-200 shadow-sm p-5 transition-smooth hover:border-slate-300",
        onClick && "cursor-pointer hover:shadow-md",
        className
      )}
    >
      {children}
    </div>
  );
});
