import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

import { AuthPageShell } from "@/components/auth-page-shell";

export const metadata: Metadata = {
  title: "Create an Account — Pergola Cave Warranty Center",
};

export default function SignUpPage() {
  return (
    <AuthPageShell
      heading="Create an account"
      description="Save your registrations and claims so you can track your warranty coverage anytime, from any device."
    >
      <SignUp />
    </AuthPageShell>
  );
}
