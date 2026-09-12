import React from "react";
import { Check } from "lucide-react";
import { clsx } from "clsx";

export interface StepItem {
  id: string;
  label: string;
  description?: string;
}

export interface StepperProps {
  steps: StepItem[];
  currentStepId: string;
  onStepClick?: (stepId: string) => void;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStepId, onStepClick }) => {
  const currentIndex = steps.findIndex(s => s.id === currentStepId);

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <React.Fragment key={step.id}>
              <div
                onClick={() => onStepClick && onStepClick(step.id)}
                className={clsx(
                  "flex flex-col items-center cursor-pointer group text-center flex-1 min-w-[80px]",
                  onStepClick && "hover:opacity-80"
                )}
              >
                <div
                  className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-smooth shadow-xs border",
                    isCompleted && "bg-emerald-600 border-emerald-600 text-white",
                    isCurrent && "bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/50",
                    !isCompleted && !isCurrent && "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={clsx(
                    "mt-2 text-[11px] font-semibold tracking-tight",
                    isCurrent ? "text-blue-700 dark:text-blue-400 font-bold" : isCompleted ? "text-slate-800 dark:text-slate-200" : "text-slate-400 dark:text-slate-500"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={clsx(
                    "h-0.5 flex-1 mx-1 rounded-full transition-smooth",
                    idx < currentIndex ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
