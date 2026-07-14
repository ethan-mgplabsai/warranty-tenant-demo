"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CustomerOrder, CustomerOrderLineItem } from "@/app/api/demo/orders/route";
import type { CustomerRegistration } from "@/app/api/demo/registrations/route";
import type { NarrationEntry } from "@/lib/warrantini-client";

function Section({ title, rows }: { title?: string; rows: Array<[string, string]> }) {
  return (
    <div>
      {title && (
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
      )}
      <dl className={title ? "mt-2 space-y-1.5" : "space-y-1.5"}>
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

export function ConfirmStep({
  order,
  lineItem,
  onBack,
  onSubmitted,
  onNarration,
}: {
  order: CustomerOrder;
  lineItem: CustomerOrderLineItem;
  onBack: () => void;
  onSubmitted: (registration: CustomerRegistration) => void;
  onNarration: (entry: NarrationEntry) => void;
}) {
  const [serialNumber, setSerialNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  const isExpired = lineItem.coverageStatus === "expired";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setAlreadyRegistered(false);
    try {
      const response = await fetch("/api/demo/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          lineItemId: lineItem.id,
          ...(serialNumber ? { serialNumber } : {}),
        }),
      });
      const data = await response.json();
      if (data.narration) onNarration(data.narration);

      if (response.status === 409) {
        setError("This item has already been registered.");
        setAlreadyRegistered(true);
        return;
      }
      if (!response.ok) {
        setError(data.message ?? "Couldn't register this product. Try again.");
        return;
      }
      onSubmitted(data as CustomerRegistration);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft /> Back
      </Button>

      <div className="mt-2">
        <h2 className="font-heading text-lg font-semibold text-foreground">Confirm registration</h2>
        <p className="mt-1 text-sm text-muted-foreground">Review the details before registering.</p>
      </div>

      {isExpired && (
        <div className="mt-4 rounded-lg border border-(--pc-warning-text)/30 bg-(--pc-warning-bg) p-3 text-sm text-(--pc-warning-text)">
          This item&apos;s original coverage window has expired. Registering now starts a new warranty
          term from today, not from the original purchase date.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-xl border border-border bg-card p-4">
        <Section
          rows={[
            ["Product", lineItem.productTitle],
            ["Order", order.orderNumber],
            ["SKU", lineItem.sku ?? "—"],
          ]}
        />
        <Section
          title="Warranty Coverage"
          rows={[
            ["Coverage period", lineItem.coverageMonths ? `${lineItem.coverageMonths} months` : "—"],
            ["Resolution type", lineItem.resolutionType ?? "—"],
            ["Return required", lineItem.isReturnRequired ? "Yes" : "No"],
          ]}
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="serial-number">Serial number (optional)</Label>
          <Input
            id="serial-number"
            value={serialNumber}
            onChange={(event) => setSerialNumber(event.target.value)}
            placeholder="e.g. SN-2024-001"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">
            {error}
            {alreadyRegistered && (
              <>
                {" "}
                <Link href="/registrations" className="underline">
                  View your registrations
                </Link>
                .
              </>
            )}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={submitting || alreadyRegistered}>
          {submitting ? "Registering…" : "Register Warranty"}
        </Button>
      </form>
    </div>
  );
}
