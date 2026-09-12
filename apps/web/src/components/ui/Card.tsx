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
        "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs p-4 sm:p-5 transition-smooth hover:border-slate-300 dark:hover:border-slate-700",
        onClick && "cursor-pointer hover:shadow-md",
        className
      )}
    >
      {children}
    </div>
  );
});

