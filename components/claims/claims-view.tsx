"use client";

import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ApiConsole } from "@/components/registrations/api-console";
import { OtpGate } from "@/components/registrations/otp-gate";
import { ClaimCard } from "@/components/claims/claim-card";
import { EmptyState } from "@/components/claims/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CustomerClaim } from "@/app/api/demo/claims/route";
import { isClaimOpen } from "@/lib/claim-status";
import type { NarrationEntry } from "@/lib/warrantini-client";

type Phase = "checking" | "otp-gate" | "list" | "error";
type Filter = "all" | "open" | "resolved";

export function ClaimsView() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [claims, setClaims] = useState<CustomerClaim[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [narrationLog, setNarrationLog] = useState<NarrationEntry[]>([]);

  const addNarration = useCallback((entry: NarrationEntry) => {
    setNarrationLog((log) => [...log, entry]);
  }, []);

  const [reloadToken, setReloadToken] = useState(0);
  const reloadClaims = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function loadClaims() {
      try {
        const response = await fetch("/api/demo/claims");
        const data = await response.json();
        if (cancelled) return;
        if (data.narration) addNarration(data.narration);
        if (response.status === 401) {
          setPhase("otp-gate");
          return;
        }
        setClaims(data.data ?? []);
        setPhase("list");
      } catch {
        if (!cancelled) setPhase("error");
      }
    }
    void loadClaims();
    return () => {
      cancelled = true;
    };
  }, [addNarration, reloadToken]);

  const filtered = claims.filter((claim) => {
    if (filter === "all") return true;
    if (filter === "open") return isClaimOpen(claim.status);
    return !isClaimOpen(claim.status);
  });

  const counts = {
    all: claims.length,
    open: claims.filter((c) => isClaimOpen(c.status)).length,
    resolved: claims.filter((c) => !isClaimOpen(c.status)).length,
  };

  return (
    <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">My Claims</h1>
            <p className="mt-1 text-sm text-muted-foreground">Track and follow up on your warranty claims.</p>
          </div>
          <Button render={<Link href="/claims/new" />}>File a Claim</Button>
        </div>

        {phase === "checking" && (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {phase === "otp-gate" && <OtpGate onNarration={addNarration} onVerified={reloadClaims} />}

        {phase === "error" && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
            <ShieldAlert className="size-8 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">
              Claims couldn&apos;t be loaded right now. Try refreshing the page.
            </p>
          </div>
        )}

        {phase === "list" && (
          <>
            {claims.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
                  <TabsList>
                    <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
                    <TabsTrigger value="open">Open ({counts.open})</TabsTrigger>
                    <TabsTrigger value="resolved">Resolved ({counts.resolved})</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="mt-4 space-y-3">
                  {filtered.map((claim) => (
                    <ClaimCard key={claim.id} claim={claim} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
        <ApiConsole entries={narrationLog} />
      </div>
    </div>
  );
}
