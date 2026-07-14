import { NextRequest, NextResponse } from "next/server";

import { setCustomerSessionCookie } from "@/lib/customer-session";
import { callWarrantini } from "@/lib/warrantini-client";

type VerifyOtpResponseBody = {
  token: string;
};

export async function POST(request: NextRequest) {
  const { email, code } = (await request.json()) as { email?: string; code?: string };
  if (!email || !code) {
    return NextResponse.json({ error: "email and code are required" }, { status: 400 });
  }

  const tenantSlug = process.env.WARRANTINI_TENANT_SLUG;
  if (!tenantSlug) {
    throw new Error("WARRANTINI_TENANT_SLUG is not configured");
  }

  const { status, data, narration } = await callWarrantini<VerifyOtpResponseBody>({
    method: "POST",
    path: "/api/v1/customer/auth/verify-otp",
    body: { email, code, tenantSlug },
  });

  if (status !== 200) {
    return NextResponse.json({ ...data, narration }, { status });
  }

  // The raw token is a live credential — redact it from the narration entry too,
  // not just the JSON body, so the narrated console/copy-as-curl never shows it.
  const redactedNarration = {
    ...narration,
    responseBody: { ...(narration.responseBody as VerifyOtpResponseBody), token: "••••••••" },
  };

  // The raw token is never sent to the browser — only the httpOnly cookie carries it.
  const response = NextResponse.json({ success: true, email, narration: redactedNarration });
  setCustomerSessionCookie(response, data.token);
  return response;
}
