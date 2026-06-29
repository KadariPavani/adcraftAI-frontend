import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export type StepperItem = {
  id: number | string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function Stepper({
  steps, current, className,
}: {
  steps: StepperItem[];
  current: number;
  className?: string;
}) {
  return (
    <ol className={cn("flex items-stretch justify-between gap-1 px-1", className)}>
      {steps.map((s, i) => {
        const Icon = s.icon;
        const isActive = current === Number(s.id);
        const isDone = current > Number(s.id);
        return (
          <li key={s.id} className={cn("flex items-center flex-1 last:flex-initial min-w-0")}>
            <div className="flex flex-col items-center gap-2 min-w-0">
              <div
                className={cn(
                  "relative w-11 h-11 rounded-2xl inline-flex items-center justify-center transition-all duration-500 ease-out",
                  isDone && "bg-success text-success-foreground shadow-soft scale-100",
                  isActive && "bg-gradient-marigold text-primary-foreground shadow-soft animate-pulse-glow scale-105",
                  !isActive && !isDone && "bg-muted text-muted-foreground",
                )}
              >
                {isDone ? <Check className="w-5 h-5" strokeWidth={2.5} /> : <Icon className="w-5 h-5" />}
                {isActive && (
                  <span aria-hidden className="absolute inset-0 rounded-2xl ring-2 ring-primary/30 animate-pulse-ring" />
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium text-center hidden sm:block transition-colors",
                  (isActive || isDone) ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="relative flex-1 h-0.5 mx-2 mt-[-1.25rem] bg-muted overflow-hidden rounded-full">
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 bg-gradient-to-r from-success to-primary transition-all duration-700 ease-out",
                    current > Number(s.id) ? "w-full" : "w-0",
                  )}
                />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
