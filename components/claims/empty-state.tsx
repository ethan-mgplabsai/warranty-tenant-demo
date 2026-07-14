import { FileText } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
      <FileText className="size-10 text-muted-foreground" strokeWidth={1.5} />
      <h2 className="font-heading text-lg font-semibold text-foreground">No claims yet</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        If something goes wrong with a registered product, you can file a claim here to start the repair,
        replacement, or refund process.
      </p>
      <Button className="mt-2" render={<Link href="/claims/new" />}>
        File a Claim
      </Button>
    </div>
  );
}
