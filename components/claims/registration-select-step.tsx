"use client";

import { Badge } from "@/components/ui/badge";
import type { CustomerRegistration } from "@/app/api/demo/registrations/route";
import { formatDate, getStatusPresentation } from "@/lib/registration-status";
import { cn } from "@/lib/utils";

export function RegistrationSelectStep({
  registrations,
  onSelectRegistration,
}: {
  registrations: CustomerRegistration[];
  onSelectRegistration: (registration: CustomerRegistration) => void;
}) {
  return (
    <div>
      <h2 className="font-heading text-lg font-semibold text-foreground">Select a registration</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose the registered product you&apos;re filing a claim for.
      </p>

      {registrations.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          You don&apos;t have any registered products yet.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {registrations.map((registration) => {
            const presentation = getStatusPresentation(registration);
            return (
              <div
                key={registration.id}
                className={cn(
                  "rounded-xl border border-border bg-card p-4",
                  presentation.clickable ? "cursor-pointer hover:shadow-md" : "opacity-60"
                )}
                onClick={presentation.clickable ? () => onSelectRegistration(registration) : undefined}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-foreground">{registration.productTitle}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 font-mono text-xs text-muted-foreground">
                      <span>{registration.id}</span>
                      <span aria-hidden="true">&middot;</span>
                      <span>
                        {formatDate(registration.coverageStarts)}
                        {registration.coverageEnds ? ` — ${formatDate(registration.coverageEnds)}` : " — Ongoing"}
                      </span>
                    </div>
                  </div>
                  <Badge variant={presentation.badgeVariant}>{presentation.badgeLabel}</Badge>
                </div>
                {!presentation.clickable && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Claims can only be filed against active registrations.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
