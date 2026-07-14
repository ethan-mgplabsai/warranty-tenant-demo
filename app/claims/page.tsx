import type { Metadata } from "next";

import { ClaimsView } from "@/components/claims/claims-view";

export const metadata: Metadata = {
  title: "My Claims — Pergola Cave Warranty Center",
};

export default function ClaimsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <ClaimsView />
    </div>
  );
}
