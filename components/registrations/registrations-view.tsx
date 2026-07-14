"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiConsole } from "@/components/registrations/api-console";
import { EmptyState } from "@/components/registrations/empty-state";
import { OtpGate } from "@/components/registrations/otp-gate";
import { RegistrationCard } from "@/components/registrations/registration-card";
import { RegistrationDrawer } from "@/components/registrations/registration-drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CustomerRegistration } from "@/app/api/demo/registrations/route";
import type { NarrationEntry } from "@/lib/warrantini-client";

type Phase = "checking" | "otp-gate" | "list";
type Filter = "all" | "active" | "expired" | "other";

export function RegistrationsView() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [registrations, setRegistrations] = useState<CustomerRegistration[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [narrationLog, setNarrationLog] = useState<NarrationEntry[]>([]);

  const addNarration = useCallback((entry: NarrationEntry) => {
    setNarrationLog((log) => [...log, entry]);
  }, []);

  const [reloadToken, setReloadToken] = useState(0);
  const reloadRegistrations = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function loadRegistrations() {
      const response = await fetch("/api/demo/registrations");
      const data = await response.json();
      if (cancelled) return;
      if (data.narration) addNarration(data.narration);
      if (response.status === 401) {
        setPhase("otp-gate");
        return;
      }
      setRegistrations(data.data ?? []);
      setPhase("list");
    }
    void loadRegistrations();
    return () => {
      cancelled = true;
    };
  }, [addNarration, reloadToken]);

  const filtered = registrations.filter((registration) => {
    if (filter === "all") return true;
    if (filter === "active") return registration.status === "active";
    if (filter === "expired") return registration.status === "expired";
    return registration.status !== "active" && registration.status !== "expired";
  });

  const counts = {
    all: registrations.length,
    active: registrations.filter((r) => r.status === "active").length,
    expired: registrations.filter((r) => r.status === "expired").length,
    other: registrations.filter((r) => r.status !== "active" && r.status !== "expired").length,
  };

  return (
    <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-foreground">My Registrations</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your warranty coverage at a glance.</p>
        </div>

        {phase === "checking" && (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {phase === "otp-gate" && <OtpGate onNarration={addNarration} onVerified={reloadRegistrations} />}

        {phase === "list" && (
          <>
            {registrations.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
                  <TabsList>
                    <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
                    <TabsTrigger value="active">Active ({counts.active})</TabsTrigger>
                    <TabsTrigger value="expired">Expired ({counts.expired})</TabsTrigger>
                    <TabsTrigger value="other">Other ({counts.other})</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="mt-4 space-y-3">
                  {filtered.map((registration) => (
                    <RegistrationCard
                      key={registration.id}
                      registration={registration}
                      onOpen={(r) => setSelectedId(r.id)}
                    />
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

      <RegistrationDrawer
        registrationId={selectedId}
        onClose={() => setSelectedId(null)}
        onNarration={addNarration}
      />
    </div>
  );
}
