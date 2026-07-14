import { format, parseISO } from "date-fns";
import { Bot, MessageCircle, User } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The live spec types claim `events` as fully opaque (`additionalProperties: {}`,
 * no field names documented at all) — this picks best-guess field names with
 * fallbacks rather than assuming a shape, and is expected to need adjusting
 * once a real payload can be inspected via the narration panel.
 */
export function pickString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return null;
}

function formatTimestamp(value: string): string {
  try {
    const parsed = parseISO(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return format(parsed, "MMM d, yyyy h:mm a");
  } catch {
    return value;
  }
}

type ActorKind = "customer" | "agent" | "system";

function resolveActorKind(actor: string | null): ActorKind {
  if (!actor) return "system";
  const normalized = actor.toLowerCase();
  if (normalized.includes("customer") || normalized.includes("you")) return "customer";
  if (normalized.includes("agent") || normalized.includes("support") || normalized.includes("staff")) {
    return "agent";
  }
  return "system";
}

const ACTOR_ICON: Record<ActorKind, typeof User> = {
  customer: User,
  agent: MessageCircle,
  system: Bot,
};

const ACTOR_COLOR_CLASS: Record<ActorKind, string> = {
  customer: "bg-(--pc-info-bg) text-(--pc-info-text)",
  agent: "bg-(--pc-success-bg) text-(--pc-success-text)",
  system: "bg-muted text-muted-foreground",
};

export function ClaimTimeline({ events }: { events: unknown[] }) {
  if (events.length === 0) {
    return <p className="mt-2 text-sm text-muted-foreground">No activity yet.</p>;
  }

  return (
    <ol className="relative mt-3 space-y-5 border-l border-border pl-6">
      {events.map((event, index) => {
        const record = (event && typeof event === "object" ? event : {}) as Record<string, unknown>;
        const message = pickString(record, ["message", "note", "text", "body", "description"]);
        const actor = pickString(record, ["actor", "actorType", "author", "createdBy"]);
        const timestamp = pickString(record, ["createdAt", "timestamp", "occurredAt"]);
        const actorKind = resolveActorKind(actor);
        const Icon = ACTOR_ICON[actorKind];

        return (
          <li key={index} className="relative">
            <div
              className={cn(
                "absolute -left-[2.05rem] grid size-6 place-items-center rounded-full",
                ACTOR_COLOR_CLASS[actorKind]
              )}
            >
              <Icon className="size-3.5" strokeWidth={1.5} />
            </div>
            <div className="font-mono text-xs text-muted-foreground">
              {timestamp && <span>{formatTimestamp(timestamp)}</span>}
              {actor && (
                <>
                  {timestamp && <span aria-hidden="true"> &middot; </span>}
                  <span className="uppercase">{actor}</span>
                </>
              )}
            </div>
            {message ? (
              <p className="mt-0.5 text-sm text-foreground">{message}</p>
            ) : (
              <dl className="mt-0.5 space-y-0.5 text-xs text-muted-foreground">
                {Object.entries(record).map(([key, value]) => (
                  <div key={key} className="flex gap-1.5">
                    <dt className="shrink-0 font-mono">{key}:</dt>
                    <dd className="truncate">{typeof value === "string" ? value : JSON.stringify(value)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </li>
        );
      })}
    </ol>
  );
}
