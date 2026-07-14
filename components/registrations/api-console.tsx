"use client";

import { Check, Copy, Terminal } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { NarrationEntry } from "@/lib/warrantini-client";

function buildCurl(entry: NarrationEntry, baseUrl: string): string {
  const parts = [`curl -X ${entry.method} '${baseUrl}${entry.path}'`, `-H 'Content-Type: application/json'`];
  if (entry.authHeaderRedacted) {
    parts.push(`-H 'Authorization: ${entry.authHeaderRedacted}'`);
  }
  if (entry.requestBody) {
    parts.push(`-d '${JSON.stringify(entry.requestBody)}'`);
  }
  return parts.join(" \\\n  ");
}

function buildFetch(entry: NarrationEntry, baseUrl: string): string {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (entry.authHeaderRedacted) {
    headers.Authorization = entry.authHeaderRedacted;
  }
  const init: Record<string, unknown> = { method: entry.method, headers };
  if (entry.requestBody) {
    init.body = JSON.stringify(entry.requestBody);
  }
  return `fetch('${baseUrl}${entry.path}', ${JSON.stringify(init, null, 2)})`;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      size="xs"
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check /> : <Copy />}
      {copied ? "Copied" : label}
    </Button>
  );
}

function NarrationRow({ entry }: { entry: NarrationEntry }) {
  const baseUrl = "https://api.warrantini.com"; // display-only placeholder; the real base URL is server-side only
  const statusVariant = entry.responseStatus < 300 ? "success" : entry.responseStatus < 500 ? "warning" : "muted";

  return (
    <div className="rounded-lg border border-border bg-card p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-mono">
          <Badge variant={statusVariant}>{entry.responseStatus}</Badge>
          <span className="font-semibold">{entry.method}</span>
          <span className="text-muted-foreground">{entry.path}</span>
        </div>
        <span className="text-muted-foreground">{entry.latencyMs}ms</span>
      </div>

      {entry.authHeaderRedacted && (
        <div className="mt-2 font-mono text-muted-foreground">
          Authorization: {entry.authHeaderRedacted}
        </div>
      )}

      {entry.requestBody != null && (
        <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-2 font-mono">
          {JSON.stringify(entry.requestBody, null, 2)}
        </pre>
      )}

      <Separator className="my-2" />

      <pre className="max-h-48 overflow-auto rounded-md bg-muted p-2 font-mono">
        {JSON.stringify(entry.responseBody, null, 2)}
      </pre>

      <div className="mt-2 flex gap-2">
        <CopyButton text={buildCurl(entry, baseUrl)} label="Copy as curl" />
        <CopyButton text={buildFetch(entry, baseUrl)} label="Copy as fetch" />
      </div>
    </div>
  );
}

export function ApiConsole({ entries }: { entries: NarrationEntry[] }) {
  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Terminal className="size-4" />
        Narrated API calls
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {entries.length === 0 && (
          <p className="text-xs text-muted-foreground">Calls made on this page will appear here.</p>
        )}
        {entries
          .slice()
          .reverse()
          .map((entry) => (
            <NarrationRow key={entry.id} entry={entry} />
          ))}
      </div>
    </div>
  );
}
