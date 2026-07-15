import type { Metadata } from "next";

import { NewClaimView } from "@/components/claims/new-claim-view";

export const metadata: Metadata = {
  title: "File a Claim — Pergola Cave Warranty Center",
};

export default function NewClaimPage() {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <NewClaimView />
    </div>
  );
}
