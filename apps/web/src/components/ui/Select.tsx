import React from "react";
import { clsx } from "clsx";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  options,
  className,
  id,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={clsx(
          "block w-full rounded-lg border text-sm px-3 py-2 transition-smooth focus:outline-none focus:ring-2 focus:ring-offset-0 bg-white dark:bg-slate-900",
          error
            ? "border-rose-300 dark:border-rose-600 text-rose-900 dark:text-rose-200 focus:border-rose-500 focus:ring-rose-500"
            : "border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-blue-500",
          className
        )}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="dark:bg-slate-900 dark:text-white">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
    </div>
  );
});

Select.displayName = "Select";

