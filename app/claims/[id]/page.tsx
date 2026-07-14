import type { Metadata } from "next";

import { ClaimDetailView } from "@/components/claims/claim-detail-view";

export const metadata: Metadata = {
  title: "Claim Detail — Pergola Cave Warranty Center",
};

export default async function ClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <ClaimDetailView claimId={id} />
    </div>
  );
}
