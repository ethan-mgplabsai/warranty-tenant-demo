import { ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
      <ShieldCheck className="size-10 text-muted-foreground" strokeWidth={1.5} />
      <h2 className="font-heading text-lg font-semibold text-foreground">No registrations yet</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Register your products to activate warranty coverage and easily file claims if something goes
        wrong.
      </p>
      <Button className="mt-2" render={<Link href="/registrations/new" />}>
        Register a Product
      </Button>
    </div>
  );
}
