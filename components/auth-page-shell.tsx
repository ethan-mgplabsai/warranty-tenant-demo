import { Mail, Phone } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

type AuthPageShellProps = {
  heading: string;
  description: string;
  children: ReactNode;
};

export function AuthPageShell({ heading, description, children }: AuthPageShellProps) {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10">
        {/* Hero */}
        <div className="relative h-56 w-full overflow-hidden rounded-xl bg-gradient-to-br from-secondary via-muted to-secondary sm:h-72">
          <div
            className="absolute inset-0 grid grid-cols-8 gap-2 p-6 opacity-40"
            aria-hidden="true"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className="rounded-full bg-primary/60" />
            ))}
          </div>
        </div>

        {/* Headline + copy */}
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            {heading}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>

        {/* Clerk widget */}
        <div className="flex justify-center">{children}</div>

        {/* Contact */}
        <Card>
          <CardContent className="flex flex-col gap-2">
            <div className="font-semibold text-foreground">Need Help?</div>
            <a
              href="tel:+15551234567"
              className="inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <Phone className="size-4 text-muted-foreground" strokeWidth={2} />
              +1 (555) 123-4567
            </a>
            <a
              href="mailto:support@pergolacave.com"
              className="inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <Mail className="size-4 text-muted-foreground" strokeWidth={2} />
              support@pergolacave.com
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
