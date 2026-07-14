import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const STEPS = ["Select Order", "Select Item", "Confirm"];

export function WizardSteps({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-6 flex items-center">
      {STEPS.map((label, index) => {
        const stepNumber = index + 1;
        const completed = stepNumber < currentStep;
        const current = stepNumber === currentStep;
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                  completed && "border-primary bg-primary text-primary-foreground",
                  current && "border-primary text-primary",
                  !completed && !current && "border-border text-muted-foreground"
                )}
              >
                {completed ? <Check className="size-3.5" /> : stepNumber}
              </div>
              <span
                className={cn(
                  "font-mono text-[0.65rem] tracking-wide uppercase",
                  current || completed ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {stepNumber < STEPS.length && (
              <div className={cn("mx-2 mb-4 h-px flex-1", completed ? "bg-primary" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
