"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { CustomerClaim } from "@/app/api/demo/claims/route";
import type { CustomerRegistration } from "@/app/api/demo/registrations/route";
import type { IssueDetails } from "@/components/claims/describe-issue-step";
import { formatDate } from "@/lib/registration-status";
import type { NarrationEntry } from "@/lib/warrantini-client";

function composeDescription(details: IssueDetails, registration: CustomerRegistration): string {
  const parts = [details.description.trim()];
  if (details.notes.trim()) {
    parts.push(`Additional notes: ${details.notes.trim()}`);
  }
  if (details.usageValue != null && registration.usageLimitMetric) {
    parts.push(
      `Current usage: ${details.usageValue} ${registration.usageLimitMetric} (coverage limit: ${registration.usageLimitValue} ${registration.usageLimitMetric})`
    );
  }
  return parts.join("\n\n");
}

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

export function ClaimReviewStep({
  registration,
  details,
  onBack,
  onSubmitted,
  onNarration,
}: {
  registration: CustomerRegistration;
  details: IssueDetails;
  onBack: () => void;
  onSubmitted: (claim: CustomerClaim) => void;
  onNarration: (entry: NarrationEntry) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const overLimit =
    details.usageValue != null &&
    registration.usageLimitValue != null &&
    details.usageValue > registration.usageLimitValue;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/demo/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: registration.id,
          description: composeDescription(details, registration),
        }),
      });
      const data = await response.json();
      if (data.narration) onNarration(data.narration);

      if (!response.ok) {
        setError(data.message ?? "Couldn't submit your claim. Try again.");
        return;
      }
      onSubmitted(data as CustomerClaim);
    } catch {
      setError("Couldn't submit your claim. Try again.");
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
        <h2 className="font-heading text-lg font-semibold text-foreground">Review your claim</h2>
        <p className="mt-1 text-sm text-muted-foreground">Make sure everything looks right before submitting.</p>
      </div>

      <div className="mt-4 space-y-4 rounded-xl border border-border bg-card p-4">
        <Section
          rows={[
            ["Product", registration.productTitle],
            ["Registration", registration.id],
            [
              "Coverage",
              `${formatDate(registration.coverageStarts)}${
                registration.coverageEnds ? ` — ${formatDate(registration.coverageEnds)}` : " — Ongoing"
              }`,
            ],
          ]}
        />

        {details.usageValue != null && registration.usageLimitMetric && (
          <Section
            title="Usage"
            rows={[
              ["Current usage", `${details.usageValue} ${registration.usageLimitMetric}`],
              ["Coverage limit", `${registration.usageLimitValue} ${registration.usageLimitMetric}`],
              ["Status", overLimit ? "Over Limit" : "Within Limit"],
            ]}
          />
        )}

        <div>
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Issue</h3>
          <p className="mt-2 text-sm whitespace-pre-wrap text-foreground">{details.description}</p>
        </div>

        {details.notes && (
          <div>
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Notes</h3>
            <p className="mt-2 text-sm whitespace-pre-wrap text-foreground">{details.notes}</p>
          </div>
        )}
      </div>

      {overLimit && (
        <div className="mt-4 rounded-lg border border-(--pc-warning-text)/30 bg-(--pc-warning-bg) p-3 text-sm text-(--pc-warning-text)">
          Usage exceeds your coverage limit. You can still submit this claim, but it will be noted during
          review.
        </div>
      )}

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <div className="mt-4 flex gap-2">
        <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting…" : "Submit Claim"}
        </Button>
        <Button variant="outline" render={<Link href="/claims" />}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
