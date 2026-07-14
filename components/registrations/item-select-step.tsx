"use client";

import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CustomerOrder, CustomerOrderLineItem } from "@/app/api/demo/orders/route";
import { getCoveragePresentation } from "@/lib/coverage-status";
import { formatDate } from "@/lib/registration-status";
import { cn } from "@/lib/utils";

export function ItemSelectStep({
  order,
  onSelectItem,
  onBack,
}: {
  order: CustomerOrder;
  onSelectItem: (item: CustomerOrderLineItem) => void;
  onBack: () => void;
}) {
  return (
    <div>
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft /> Back
      </Button>

      <div className="mt-2">
        <h2 className="font-heading text-lg font-semibold text-foreground">Select an item</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Order #{order.orderNumber} · {formatDate(order.orderedAt)}
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {order.lineItems.map((item) => {
          const presentation = getCoveragePresentation(item);
          return (
            <div
              key={item.id}
              className={cn(
                "rounded-xl border border-border bg-card p-4",
                presentation.clickable ? "cursor-pointer hover:shadow-md" : "opacity-70"
              )}
              onClick={presentation.clickable ? () => onSelectItem(item) : undefined}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-foreground">{item.productTitle}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 font-mono text-xs text-muted-foreground">
                    {item.category && <span>{item.category}</span>}
                    {item.sku && (
                      <>
                        {item.category && <span aria-hidden="true">&middot;</span>}
                        <span>{item.sku}</span>
                      </>
                    )}
                  </div>
                </div>
                <Badge variant={presentation.badgeVariant}>{presentation.badgeLabel}</Badge>
              </div>
              <div className={cn("mt-2 text-xs font-medium", presentation.detailColorClass)}>
                {presentation.detailText}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
