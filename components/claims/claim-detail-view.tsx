"use client";

import { ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ClaimReplyForm } from "@/components/claims/claim-reply-form";
import { ClaimTimeline, pickString } from "@/components/claims/claim-timeline";
import { ApiConsole } from "@/components/registrations/api-console";
import { OtpGate } from "@/components/registrations/otp-gate";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { CustomerClaim } from "@/app/api/demo/claims/route";
import { getClaimStatusPresentation } from "@/lib/claim-status";
import { formatDate } from "@/lib/registration-status";
import type { NarrationEntry } from "@/lib/warrantini-client";

type Phase = "checking" | "otp-gate" | "loaded" | "error";

type DetailData = {
  claim: CustomerClaim;
  events: unknown[];
  attachments: unknown[];
};

export function ClaimDetailView({ claimId }: { claimId: string }) {
  const [phase, setPhase] = useState<Phase>("checking");
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [narrationLog, setNarrationLog] = useState<NarrationEntry[]>([]);

  const addNarration = useCallback((entry: NarrationEntry) => {
    setNarrationLog((log) => [...log, entry]);
  }, []);

  const [reloadToken, setReloadToken] = useState(0);
  const reloadDetail = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function loadDetail() {
      try {
        const response = await fetch(`/api/demo/claims/${claimId}`);
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
        setDetail(data);
        setPhase("loaded");
      } catch {
        if (!cancelled) setPhase("error");
      }
    }
    void loadDetail();
    return () => {
      cancelled = true;
    };
  }, [addNarration, claimId, reloadToken]);

  const presentation = detail ? getClaimStatusPresentation(detail.claim.status) : null;

  return (
    <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <Link
          href="/claims"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to claims
        </Link>

        {phase === "checking" && (
          <div className="mt-4 space-y-3">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {phase === "otp-gate" && (
          <div className="mt-4">
            <OtpGate onNarration={addNarration} onVerified={reloadDetail} />
          </div>
        )}

        {phase === "error" && (
          <div className="mt-8 flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
            <ShieldAlert className="size-8 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">This claim couldn&apos;t be loaded.</p>
          </div>
        )}

        {phase === "loaded" && detail && presentation && (
          <div className="mt-4 space-y-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-xs text-muted-foreground">{detail.claim.id}</div>
                <h1 className="font-heading text-xl font-semibold text-foreground">
                  {detail.claim.productTitle ?? "Claim"}
                </h1>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 font-mono text-xs text-muted-foreground">
                  <span>{detail.claim.registrationId}</span>
                  <span aria-hidden="true">&middot;</span>
                  <span>Filed {formatDate(detail.claim.createdAt)}</span>
                </div>
              </div>
              <Badge variant={presentation.badgeVariant}>{presentation.badgeLabel}</Badge>
            </div>

            {detail.claim.status === "info_requested" && (
              <div className="rounded-lg border border-(--pc-warning-text)/30 bg-(--pc-warning-bg) p-4">
                <div className="flex items-center gap-2 font-semibold text-(--pc-warning-text)">
                  <ShieldAlert className="size-4" />
                  Additional information requested
                </div>
                <p className="mt-1 text-sm text-(--pc-warning-text)">
                  The Pergola Cave team has asked for more details on this claim. Reply below to keep it moving.
                </p>
              </div>
            )}

            <section>
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Description</h2>
              <p className="mt-2 text-sm text-foreground">{detail.claim.description}</p>
            </section>

            {detail.attachments.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Attachments
                </h2>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {detail.attachments.map((attachment, index) => {
                    const record = (attachment && typeof attachment === "object" ? attachment : {}) as Record<
                      string,
                      unknown
                    >;
                    const fileName = pickString(record, ["fileName", "name"]) ?? `Attachment ${index + 1}`;
                    const blobUrl = pickString(record, ["blobUrl", "url"]);
                    return (
                      <li key={index}>
                        {blobUrl ? (
                          <a href={blobUrl} target="_blank" rel="noreferrer" className="text-primary underline">
                            {fileName}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">{fileName}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <section>
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Timeline</h2>
              <ClaimTimeline events={detail.events} />
            </section>

            {detail.claim.status === "info_requested" && (
              <ClaimReplyForm
                claimId={detail.claim.id}
                onNarration={addNarration}
                onReplied={reloadDetail}
                onUnauthorized={() => setPhase("otp-gate")}
              />
            )}
          </div>
        )}
      </div>

      <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
        <ApiConsole entries={narrationLog} />
      </div>
    </div>
  );
}
