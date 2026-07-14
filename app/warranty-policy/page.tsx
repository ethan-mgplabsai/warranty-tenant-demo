import type { Metadata } from "next";

import { PolicyView } from "@/components/warranty-policy/policy-view";

export const metadata: Metadata = {
  title: "Warranty Policy — Pergola Cave Warranty Center",
};

export default function WarrantyPolicyPage() {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <PolicyView />
    </div>
  );
}
