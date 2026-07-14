"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { NarrationEntry } from "@/lib/warrantini-client";

type Step = "email" | "code";

export function OtpGate({
  onVerified,
  onNarration,
}: {
  onVerified: () => void;
  onNarration: (entry: NarrationEntry) => void;
}) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSendOtp(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/demo/customer-auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (data.narration) onNarration(data.narration);
      if (!response.ok) {
        setError(data.message ?? "Could not send a code. Try again.");
        return;
      }
      setDevCode(data.code ?? null);
      setStep("code");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/demo/customer-auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await response.json();
      if (data.narration) onNarration(data.narration);
      if (!response.ok) {
        setError(data.message ?? "That code didn't work. Try again.");
        return;
      }
      onVerified();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardContent className="flex flex-col gap-4">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            {step === "email" ? "Find your registrations" : "Enter your code"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === "email"
              ? "We'll send a 6-digit code to verify it's really you."
              : `We sent a code to ${email}.`}
          </p>
        </div>

        {step === "email" ? (
          <form className="flex flex-col gap-3" onSubmit={handleSendOtp}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={submitting}>
              {submitting ? "Sending…" : "Send code"}
            </Button>
          </form>
        ) : (
          <form className="flex flex-col gap-3" onSubmit={handleVerifyOtp}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="code">6-digit code</Label>
              <Input
                id="code"
                inputMode="numeric"
                maxLength={6}
                required
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="123456"
              />
              {devCode && (
                <p className="text-xs text-muted-foreground">
                  Sandbox mode — your code is <span className="font-mono font-semibold">{devCode}</span>
                </p>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={submitting}>
              {submitting ? "Verifying…" : "Verify"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep("email")}>
              Use a different email
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
