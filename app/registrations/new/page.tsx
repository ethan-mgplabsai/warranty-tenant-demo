import type { Metadata } from "next";

import { WizardView } from "@/components/registrations/wizard-view";

export const metadata: Metadata = {
  title: "Register a Product — Pergola Cave Warranty Center",
};

export default function RegisterProductPage() {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <WizardView />
    </div>
  );
}
