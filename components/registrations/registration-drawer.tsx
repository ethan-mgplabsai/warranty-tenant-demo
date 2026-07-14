"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { CustomerRegistration } from "@/app/api/demo/registrations/route";
import { formatDate, getStatusPresentation } from "@/lib/registration-status";
import type { NarrationEntry } from "@/lib/warrantini-client";

type DetailData = {
  registration: CustomerRegistration;
  order: { id: string; orderNumber: string; orderedAt: string; fulfilledAt: string | null } | null;
  lineItem: {
    id: string;
    sku: string | null;
    productTitle: string;
    productType: string | null;
    category: string | null;
    price: string;
    imageUrl: string | null;
  } | null;
};

function Section({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <div>
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
      <dl className="mt-2 space-y-1.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 text-sm">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right font-medium text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function RegistrationDrawer({
  registrationId,
  onClose,
  onNarration,
}: {
  registrationId: string | null;
  onClose: () => void;
  onNarration: (entry: NarrationEntry) => void;
}) {
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!registrationId) return;
    let cancelled = false;
    async function loadDetail() {
      setLoading(true);
      const response = await fetch(`/api/demo/registrations/${registrationId}`);
      const data = await response.json();
      if (cancelled) return;
      if (data.narration) onNarration(data.narration);
      if (data.registration) setDetail(data);
      setLoading(false);
    }
    void loadDetail();
    return () => {
      cancelled = true;
    };
  }, [registrationId, onNarration]);

  // Ignore stale detail from a previously-open registration rather than
  // clearing it synchronously on close — avoids a setState-in-effect.
  const current = detail && detail.registration.id === registrationId ? detail : null;
  const presentation = current ? getStatusPresentation(current.registration) : null;

  return (
    <Sheet open={registrationId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Registration Detail</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-4">
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {current && presentation && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs text-muted-foreground">{current.registration.id}</div>
                  <div className="font-heading text-base font-semibold text-foreground">
                    {current.registration.productTitle}
                  </div>
                </div>
                <Badge variant={presentation.badgeVariant}>{presentation.badgeLabel}</Badge>
              </div>

              <Section
                title="Product"
                rows={[
                  ["Product", current.registration.productTitle],
                  ["SKU", current.lineItem?.sku ?? current.registration.sku ?? "—"],
                  ["Category", current.lineItem?.category ?? current.registration.productType ?? "—"],
                  ["Serial number", current.registration.serialNumber ?? "—"],
                ]}
              />

              <Section
                title="Coverage"
                rows={[
                  ["Coverage starts", formatDate(current.registration.coverageStarts)],
                  [
                    "Coverage ends",
                    current.registration.coverageEnds ? formatDate(current.registration.coverageEnds) : "Ongoing",
                  ],
                  ...(current.registration.usageLimitMetric && current.registration.usageLimitValue != null
                    ? ([
                        [
                          "Usage limit",
                          `${current.registration.usageLimitValue} ${current.registration.usageLimitMetric}`,
                        ],
                      ] as Array<[string, string]>)
                    : []),
                  ["Warranty rule", current.registration.warrantyRuleId],
                  ["Registered", formatDate(current.registration.createdAt)],
                ]}
              />

              {current.order && (
                <Section
                  title="Order"
                  rows={[
                    ["Order number", current.order.orderNumber],
                    ["Ordered", formatDate(current.order.orderedAt)],
                    ["Fulfilled", current.order.fulfilledAt ? formatDate(current.order.fulfilledAt) : "—"],
                  ]}
                />
              )}
            </>
          )}
        </div>

        <SheetFooter className="flex-row">
          <Button
            className="flex-1"
            disabled={!current || current.registration.status !== "active"}
            title="Claim filing isn't built yet"
          >
            File a Claim
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
