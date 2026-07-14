import { AlertTriangle, CheckCircle2, Clock, MessageCircleQuestion, XCircle } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { CustomerClaim } from "@/app/api/demo/claims/route";
import { getClaimStatusPresentation } from "@/lib/claim-status";
import { formatDate } from "@/lib/registration-status";
import { cn } from "@/lib/utils";

function StatusIcon({ status }: { status: string }) {
  if (status === "info_requested") return <MessageCircleQuestion className="size-[22px]" strokeWidth={1.5} />;
  if (status === "escalated") return <AlertTriangle className="size-[22px]" strokeWidth={1.5} />;
  if (status === "approved") return <CheckCircle2 className="size-[22px]" strokeWidth={1.5} />;
  if (status === "rejected") return <XCircle className="size-[22px]" strokeWidth={1.5} />;
  return <Clock className="size-[22px]" strokeWidth={1.5} />;
}

export function ClaimCard({ claim }: { claim: CustomerClaim }) {
  const presentation = getClaimStatusPresentation(claim.status);

  return (
    <Link
      href={`/claims/${claim.id}`}
      className="block rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full bg-muted text-foreground",
            presentation.badgeVariant === "success" && "bg-(--pc-success-bg) text-(--pc-success-text)",
            presentation.badgeVariant === "info" && "bg-(--pc-info-bg) text-(--pc-info-text)",
            presentation.badgeVariant === "warning" && "bg-(--pc-warning-bg) text-(--pc-warning-text)",
            presentation.badgeVariant === "destructive" && "bg-destructive/10 text-destructive"
          )}
        >
          <StatusIcon status={claim.status} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-foreground">{claim.productTitle ?? "Claim"}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 font-mono text-xs text-muted-foreground">
            <span>{claim.id}</span>
            <span aria-hidden="true">&middot;</span>
            <span>{claim.registrationId}</span>
            <span aria-hidden="true">&middot;</span>
            <span>Filed {formatDate(claim.createdAt)}</span>
          </div>
        </div>
        <Badge variant={presentation.badgeVariant}>{presentation.badgeLabel}</Badge>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{claim.description}</p>
    </Link>
  );
}
