import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CustomerClaim } from "@/app/api/demo/claims/route";

export function ClaimSuccessStep({ claim }: { claim: CustomerClaim }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card py-12 text-center">
      <CheckCircle2 className="size-12 text-(--pc-success-text)" strokeWidth={1.5} />
      <h2 className="font-heading text-xl font-semibold text-foreground">Claim submitted</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Your claim for {claim.productTitle ?? "this product"} has been submitted. We&apos;ll review it and
        follow up soon.
      </p>

      <div className="mt-2 w-full max-w-xs space-y-1.5 rounded-lg bg-muted p-4 text-left text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Claim ID</span>
          <span className="font-mono text-xs text-foreground">{claim.id}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Status</span>
          <Badge variant="muted">Submitted</Badge>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button render={<Link href="/claims" />}>View My Claims</Button>
        <Button variant="outline" render={<Link href="/registrations" />}>
          Back to Registrations
        </Button>
      </div>
    </div>
  );
}
