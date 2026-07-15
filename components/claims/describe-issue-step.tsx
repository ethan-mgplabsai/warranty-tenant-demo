"use client";

import { ArrowLeft } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CustomerRegistration } from "@/app/api/demo/registrations/route";
import { formatDate } from "@/lib/registration-status";

export type IssueDetails = {
  description: string;
  notes: string;
  usageValue: number | null;
};

const MIN_DESCRIPTION_LENGTH = 20;

export function DescribeIssueStep({
  registration,
  onBack,
  onContinue,
}: {
  registration: CustomerRegistration;
  onBack: () => void;
  onContinue: (details: IssueDetails) => void;
}) {
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [usageInput, setUsageInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const hasUsage = Boolean(registration.usageLimitMetric && registration.usageLimitValue != null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (description.trim().length < MIN_DESCRIPTION_LENGTH) {
      setError(`Please describe the issue in at least ${MIN_DESCRIPTION_LENGTH} characters.`);
      return;
    }
    setError(null);

    const parsedUsage = hasUsage && usageInput.trim() !== "" ? Number(usageInput) : null;
    const usageValue = parsedUsage !== null && Number.isFinite(parsedUsage) ? parsedUsage : null;
    onContinue({ description, notes, usageValue });
  }

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft /> Back
      </Button>

      <div className="mt-2">
        <h2 className="font-heading text-lg font-semibold text-foreground">Describe the issue</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {registration.productTitle} · <span className="font-mono">{registration.id}</span>
          {registration.coverageEnds && ` · Active until ${formatDate(registration.coverageEnds)}`}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">
            What went wrong? <span className="text-muted-foreground">(min {MIN_DESCRIPTION_LENGTH} characters)</span>
          </Label>
          <textarea
            id="description"
            required
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe the defect or issue you're experiencing…"
            rows={5}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        {hasUsage && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="usage">Current usage</Label>
            <div className="flex items-center gap-2">
              <Input
                id="usage"
                type="number"
                inputMode="decimal"
                min={0}
                value={usageInput}
                onChange={(event) => setUsageInput(event.target.value)}
                className="max-w-40"
              />
              <span className="text-sm text-muted-foreground">{registration.usageLimitMetric}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the current reading for your {registration.productTitle}.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Additional notes (optional)</Label>
          <textarea
            id="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Anything else the warranty team should know?"
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full">
          Continue
        </Button>
      </form>
    </div>
  );
}
