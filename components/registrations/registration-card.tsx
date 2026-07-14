import { CheckCircle2, Clock, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { CustomerRegistration } from "@/app/api/demo/registrations/route";
import { formatDate, getStatusPresentation } from "@/lib/registration-status";
import { cn } from "@/lib/utils";

function StatusIcon({ status }: { status: string }) {
  if (status === "replaced") return <RefreshCw className="size-[22px]" strokeWidth={1.5} />;
  if (status === "active") return <CheckCircle2 className="size-[22px]" strokeWidth={1.5} />;
  return <Clock className="size-[22px]" strokeWidth={1.5} />;
}

export function RegistrationCard({
  registration,
  onOpen,
}: {
  registration: CustomerRegistration;
  onOpen: (registration: CustomerRegistration) => void;
}) {
  const presentation = getStatusPresentation(registration);

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 transition-shadow",
        presentation.faded && "opacity-70",
        presentation.clickable && "cursor-pointer hover:shadow-md"
      )}
      onClick={presentation.clickable ? () => onOpen(registration) : undefined}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full bg-muted text-foreground",
            presentation.badgeVariant === "success" && "bg-(--pc-success-bg) text-(--pc-success-text)",
            presentation.badgeVariant === "info" && "bg-(--pc-info-bg) text-(--pc-info-text)"
          )}
        >
          <StatusIcon status={registration.status} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-foreground">{registration.productTitle}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 font-mono text-xs text-muted-foreground">
            <span>{registration.id}</span>
            {registration.productType && (
              <>
                <span aria-hidden="true">&middot;</span>
                <span>{registration.productType}</span>
              </>
            )}
            {registration.sku && (
              <>
                <span aria-hidden="true">&middot;</span>
                <span>{registration.sku}</span>
              </>
            )}
          </div>
        </div>
        <Badge variant={presentation.badgeVariant}>{presentation.badgeLabel}</Badge>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", presentation.barColorClass)}
            style={{ width: `${presentation.coveragePercent}%` }}
          />
        </div>
        <span className="shrink-0 font-mono text-xs text-muted-foreground">
          {formatDate(registration.coverageStarts)}
          {registration.coverageEnds ? ` — ${formatDate(registration.coverageEnds)}` : " — Ongoing"}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          Order <span className="font-mono">{registration.orderNumber ?? registration.orderId}</span>
        </span>
        <span className={presentation.footerColorClass}>{presentation.footerText}</span>
      </div>
    </div>
  );
}
