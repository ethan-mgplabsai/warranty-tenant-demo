"use client";

import { ShieldAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ClaimReviewStep } from "@/components/claims/claim-review-step";
import { ClaimSuccessStep } from "@/components/claims/claim-success-step";
import { DescribeIssueStep, type IssueDetails } from "@/components/claims/describe-issue-step";
import { RegistrationSelectStep } from "@/components/claims/registration-select-step";
import { ApiConsole } from "@/components/registrations/api-console";
import { OtpGate } from "@/components/registrations/otp-gate";
import { WizardSteps } from "@/components/registrations/wizard-steps";
import { Skeleton } from "@/components/ui/skeleton";
import type { CustomerClaim } from "@/app/api/demo/claims/route";
import type { CustomerRegistration } from "@/app/api/demo/registrations/route";
import type { NarrationEntry } from "@/lib/warrantini-client";

type Phase = "checking" | "otp-gate" | "error" | "registrations" | "describe" | "review" | "success";

export function NewClaimView() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [registrations, setRegistrations] = useState<CustomerRegistration[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<CustomerRegistration | null>(null);
  const [issueDetails, setIssueDetails] = useState<IssueDetails | null>(null);
  const [claim, setClaim] = useState<CustomerClaim | null>(null);
  const [narrationLog, setNarrationLog] = useState<NarrationEntry[]>([]);

  const addNarration = useCallback((entry: NarrationEntry) => {
    setNarrationLog((log) => [...log, entry]);
  }, []);

  const [reloadToken, setReloadToken] = useState(0);
  const reloadRegistrations = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function loadRegistrations() {
      try {
        const response = await fetch("/api/demo/registrations");
        const data = await response.json();
        if (cancelled) return;
        if (data.narration) addNarration(data.narration);
        if (response.status === 401) {
          setPhase("otp-gate");
          return;
        }
        if (!response.ok) {
          setPhase("error");
          return;
        }
        setRegistrations(data.data ?? []);
        setPhase("registrations");
      } catch {
        if (!cancelled) setPhase("error");
      }
    }
    void loadRegistrations();
    return () => {
      cancelled = true;
    };
  }, [addNarration, reloadToken]);

  const stepNumber = phase === "registrations" ? 1 : phase === "describe" ? 2 : phase === "review" ? 3 : 4;

  return (
    <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-foreground">File a Claim</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Start the repair, replacement, or refund process for a registered product.
          </p>
        </div>

        {(phase === "registrations" || phase === "describe" || phase === "review") && (
          <WizardSteps steps={["Registration", "Describe", "Review"]} currentStep={stepNumber} />
        )}

        {phase === "checking" && (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {phase === "otp-gate" && <OtpGate onNarration={addNarration} onVerified={reloadRegistrations} />}

        {phase === "error" && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
            <ShieldAlert className="size-8 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">
              Your registrations couldn&apos;t be loaded right now. Try refreshing the page.
            </p>
          </div>
        )}

        {phase === "registrations" && (
          <RegistrationSelectStep
            registrations={registrations}
            onSelectRegistration={(registration) => {
              setSelectedRegistration(registration);
              setPhase("describe");
            }}
          />
        )}

        {phase === "describe" && selectedRegistration && (
          <DescribeIssueStep
            registration={selectedRegistration}
            onBack={() => setPhase("registrations")}
            onContinue={(details) => {
              setIssueDetails(details);
              setPhase("review");
            }}
          />
        )}

        {phase === "review" && selectedRegistration && issueDetails && (
          <ClaimReviewStep
            registration={selectedRegistration}
            details={issueDetails}
            onBack={() => setPhase("describe")}
            onNarration={addNarration}
            onSubmitted={(result) => {
              setClaim(result);
              setPhase("success");
            }}
          />
        )}

        {phase === "success" && claim && <ClaimSuccessStep claim={claim} />}
      </div>

      <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
        <ApiConsole entries={narrationLog} />
      </div>
    </div>
  );
}
