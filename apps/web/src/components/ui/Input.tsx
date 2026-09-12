import React from "react";
import { clsx } from "clsx";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  className,
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative rounded-md shadow-2xs">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            "block w-full rounded-lg border text-sm transition-smooth focus:outline-none focus:ring-2 focus:ring-offset-0 bg-white dark:bg-slate-900",
            leftIcon ? "pl-9" : "px-3",
            "py-2",
            error
              ? "border-rose-300 dark:border-rose-600 text-rose-900 dark:text-rose-200 placeholder-rose-300 dark:placeholder-rose-500 focus:border-rose-500 focus:ring-rose-500"
              : "border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
      {helperText && !error && <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}
    </div>
  );
});

Input.displayName = "Input";

