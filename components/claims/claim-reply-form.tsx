"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { NarrationEntry } from "@/lib/warrantini-client";

export function ClaimReplyForm({
  claimId,
  onNarration,
  onReplied,
  onUnauthorized,
}: {
  claimId: string;
  onNarration: (entry: NarrationEntry) => void;
  onReplied: () => void;
  onUnauthorized: () => void;
}) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSent(false);
    try {
      const response = await fetch(`/api/demo/claims/${claimId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      if (data.narration) onNarration(data.narration);

      if (response.status === 401) {
        onUnauthorized();
        return;
      }
      if (!response.ok) {
        setError(data.message ?? "Couldn't send your reply. Try again.");
        return;
      }
      setMessage("");
      setSent(true);
      onReplied();
    } catch {
      setError("Couldn't send your reply. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Reply</h2>
      <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2">
        <Label htmlFor="reply-message" className="sr-only">
          Reply message
        </Label>
        <textarea
          id="reply-message"
          required
          minLength={1}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Add the details the team asked for…"
          rows={4}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {sent && !error && <p className="text-sm text-(--pc-success-text)">Reply sent.</p>}
        <Button type="submit" className="self-start" disabled={submitting}>
          {submitting ? "Sending…" : "Send Reply"}
        </Button>
      </form>
    </section>
  );
}
