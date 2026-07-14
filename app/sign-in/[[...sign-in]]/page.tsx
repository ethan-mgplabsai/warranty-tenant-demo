import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

import { AuthPageShell } from "@/components/auth-page-shell";

export const metadata: Metadata = {
  title: "Sign In — Pergola Cave Warranty Center",
};

export default function SignInPage() {
  return (
    <AuthPageShell
      heading="Welcome back"
      description="Sign in to pick up right where you left off — your registrations and claims are saved to your account."
    >
      <SignIn />
    </AuthPageShell>
  );
}
