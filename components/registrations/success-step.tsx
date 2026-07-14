import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CustomerRegistration } from "@/app/api/demo/registrations/route";
import { formatDate } from "@/lib/registration-status";

export function SuccessStep({
  registration,
  onRegisterAnother,
}: {
  registration: CustomerRegistration;
  onRegisterAnother: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card py-12 text-center">
      <CheckCircle2 className="size-12 text-(--pc-success-text)" strokeWidth={1.5} />
      <h2 className="font-heading text-xl font-semibold text-foreground">Warranty registered</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        {registration.productTitle} is now covered. A confirmation has been sent to{" "}
        {registration.customerEmail}.
      </p>

      <div className="mt-2 w-full max-w-xs space-y-1.5 rounded-lg bg-muted p-4 text-left text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Registration ID</span>
          <span className="font-mono text-xs text-foreground">{registration.id}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Coverage</span>
          <span className="text-foreground">
            {formatDate(registration.coverageStarts)}
            {registration.coverageEnds ? ` — ${formatDate(registration.coverageEnds)}` : " — Ongoing"}
          </span>
        </div>
        {registration.usageLimitMetric && registration.usageLimitValue != null && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Usage limit</span>
            <span className="text-foreground">
              {registration.usageLimitValue} {registration.usageLimitMetric}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Status</span>
          <Badge variant="success">Active</Badge>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button render={<Link href="/registrations" />}>View My Registrations</Button>
        <Button variant="outline" onClick={onRegisterAnother}>
          Register Another Product
        </Button>
      </div>
    </div>
  );
}
