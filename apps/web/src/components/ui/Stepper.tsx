import React from "react";
import { Check } from "lucide-react";
import { cn } from "../../lib/cn";

export interface StepItem {
  id: string;
  label: string;
  description?: string;
}

export type Step = StepItem;

export interface StepperProps {
  steps: StepItem[];
  currentStepId: string;
  onStepClick?: (stepId: string) => void;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStepId, onStepClick }) => {
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);

  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <React.Fragment key={step.id}>
              <div
                onClick={() => onStepClick?.(step.id)}
                className={cn(
                  "flex flex-col items-center text-center flex-1 min-w-[72px]",
                  onStepClick && "cursor-pointer group"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-smooth border",
                    isCompleted && "bg-success border-success text-success-foreground",
                    isCurrent &&
                      "bg-primary border-primary text-primary-foreground ring-4 ring-primary/15",
                    !isCompleted &&
                      !isCurrent &&
                      "bg-muted border-border text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={cn(
                    "mt-2 text-2xs font-semibold tracking-tight",
                    isCurrent
                      ? "text-primary"
                      : isCompleted
                        ? "text-foreground"
                        : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-1 rounded-full transition-smooth",
                    idx < currentIndex ? "bg-success" : "bg-border"
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
