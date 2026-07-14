"use client";

import { format, parseISO } from "date-fns";
import { useEffect, useState } from "react";

import { ApiConsole } from "@/components/registrations/api-console";
import { Skeleton } from "@/components/ui/skeleton";
import type { PublishedWarrantyPolicy } from "@/app/api/demo/warranty-policy/route";
import type { WarrantyRule } from "@/app/api/demo/rules/route";
import type { NarrationEntry } from "@/lib/warrantini-client";

const RESOLUTION_LABELS: Record<string, string> = {
  repair: "Repair",
  replace_part: "Replace Part",
  replace_full: "Replace Full",
  refund: "Refund",
};

function formatDuration(months: number | null): string {
  return months ? `${months} month${months === 1 ? "" : "s"}` : "Lifetime";
}

type Phase = "loading" | "loaded" | "error";

export function PolicyView() {
  const [policyPhase, setPolicyPhase] = useState<Phase>("loading");
  const [policy, setPolicy] = useState<PublishedWarrantyPolicy | null>(null);
  const [rulesPhase, setRulesPhase] = useState<Phase>("loading");
  const [rules, setRules] = useState<WarrantyRule[]>([]);
  const [narrationLog, setNarrationLog] = useState<NarrationEntry[]>([]);

  const addNarration = (entry: NarrationEntry) => setNarrationLog((log) => [...log, entry]);

  useEffect(() => {
    let cancelled = false;

    async function loadPolicy() {
      try {
        const response = await fetch("/api/demo/warranty-policy");
        const data = await response.json();
        if (cancelled) return;
        if (data.narration) addNarration(data.narration);
        if (!response.ok) {
          setPolicyPhase("error");
          return;
        }
        setPolicy(data);
        setPolicyPhase("loaded");
      } catch {
        if (!cancelled) setPolicyPhase("error");
      }
    }

    async function loadRules() {
      try {
        const response = await fetch("/api/demo/rules");
        const data = await response.json();
        if (cancelled) return;
        if (data.narration) addNarration(data.narration);
        if (!response.ok) {
          setRulesPhase("error");
          return;
        }
        setRules(data.data ?? []);
        setRulesPhase("loaded");
      } catch {
        if (!cancelled) setRulesPhase("error");
      }
    }

    void loadPolicy();
    void loadRules();
    return () => {
      cancelled = true;
    };
  }, []);

  const includeRules = rules
    .filter((rule) => rule.rule_type === "include")
    .sort((a, b) => a.priority - b.priority);
  const excludeRules = rules
    .filter((rule) => rule.rule_type === "exclude")
    .sort((a, b) => a.priority - b.priority);

  return (
    <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {policy?.title ?? "Warranty Policy"}
        </h1>
        {policy?.updatedAt && (
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            Last updated {format(parseISO(policy.updatedAt), "MMMM yyyy")}
          </p>
        )}

        <div className="mt-4">
          {policyPhase === "loading" && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          )}
          {policyPhase === "loaded" && policy && (
            // Trusted first-party content authored by the tenant on Warrantini's
            // own admin dashboard — not visitor-supplied input.
            <div
              className="prose prose-sm max-w-none text-sm text-muted-foreground [&_p]:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: policy.content }}
            />
          )}
          {policyPhase === "error" && (
            <p className="text-sm text-muted-foreground">
              Pergola Cave stands behind every pergola, roof system, and accessory we sell. Our
              warranty covers manufacturing defects in materials and workmanship under normal use,
              for the duration specified for each product category below.
            </p>
          )}
        </div>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
          <section>
            <h2 className="font-heading text-base font-semibold text-foreground">
              Coverage by Category
            </h2>
            {rulesPhase === "loading" && (
              <div className="mt-3 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}
            {rulesPhase === "error" && (
              <p className="mt-2 text-muted-foreground">
                Coverage details are being updated — check back soon.
              </p>
            )}
            {rulesPhase === "loaded" &&
              (includeRules.length === 0 ? (
                <p className="mt-2 text-muted-foreground">No coverage rules are configured yet.</p>
              ) : (
                <div className="mt-3 overflow-hidden overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2.5 font-semibold text-foreground">Category</th>
                        <th className="px-4 py-2.5 font-semibold text-foreground">Duration</th>
                        <th className="px-4 py-2.5 font-semibold text-foreground">Resolution</th>
                        <th className="px-4 py-2.5 font-semibold text-foreground">Return Required</th>
                      </tr>
                    </thead>
                    <tbody>
                      {includeRules.map((rule) => (
                        <tr key={rule.id} className="border-t border-border">
                          <td className="px-4 py-2.5">{rule.name}</td>
                          <td className="px-4 py-2.5">{formatDuration(rule.coverage_months)}</td>
                          <td className="px-4 py-2.5">
                            {rule.default_resolution_type
                              ? (RESOLUTION_LABELS[rule.default_resolution_type] ?? rule.default_resolution_type)
                              : "—"}
                          </td>
                          <td className="px-4 py-2.5">{rule.is_return_required ? "Yes" : "No"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
          </section>

          <section>
            <h2 className="font-heading text-base font-semibold text-foreground">What&apos;s Covered</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted-foreground">
              {includeRules.filter((rule) => rule.covers).length > 0 ? (
                includeRules
                  .filter((rule) => rule.covers)
                  .map((rule) => <li key={rule.id}>{rule.covers}</li>)
              ) : (
                <>
                  <li>Manufacturing defects in materials and workmanship</li>
                  <li>Mechanical and electrical component failures under normal use</li>
                  <li>Structural integrity issues (frames, welds, hardware)</li>
                </>
              )}
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-base font-semibold text-foreground">
              What&apos;s Not Covered
            </h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted-foreground">
              {excludeRules
                .filter((rule) => rule.exclusions)
                .map((rule) => (
                  <li key={rule.id}>{rule.exclusions}</li>
                ))}
              <li>Normal wear and tear</li>
              <li>Damage caused by misuse, abuse, or negligence</li>
              <li>Unauthorized modifications or repairs</li>
              <li>Cosmetic damage that does not affect functionality</li>
              <li>Products purchased from unauthorized retailers</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-base font-semibold text-foreground">
              How to File a Claim
            </h2>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-muted-foreground">
              <li>Select the registered product you&apos;re filing a claim for</li>
              <li>Describe the issue and attach photos of the defect</li>
              <li>Our team reviews your claim within 2 business days</li>
              <li>
                If approved, we process the resolution (repair, replacement, or refund) and provide
                return instructions if applicable
              </li>
            </ol>
          </section>

          <section>
            <h2 className="font-heading text-base font-semibold text-foreground">Conditions</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted-foreground">
              <li>Products must be registered within 30 days of purchase to be eligible for coverage</li>
              <li>Proof of purchase is required — your order is automatically linked during registration</li>
              <li>When a return is required, the item must be shipped within 14 days of claim approval</li>
              <li>Warranty coverage begins on the date of purchase and is non-transferable</li>
            </ul>
          </section>
        </div>
      </div>

      <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
        <ApiConsole entries={narrationLog} />
      </div>
    </div>
  );
}
