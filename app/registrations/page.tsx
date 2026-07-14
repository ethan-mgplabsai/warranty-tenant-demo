import type { Metadata } from "next";

import { RegistrationsView } from "@/components/registrations/registrations-view";

export const metadata: Metadata = {
  title: "My Registrations — Pergola Cave Warranty Center",
};

export default function RegistrationsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <RegistrationsView />
    </div>
  );
}
