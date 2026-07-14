import { NextRequest, NextResponse } from "next/server";

import { checkOtpSendRateLimit, getClientIp } from "@/lib/rate-limit";
import { callWarrantini } from "@/lib/warrantini-client";

type SendOtpResponseBody = {
  success: true;
  message: string;
  code?: string;
};

export async function POST(request: NextRequest) {
  const { email } = (await request.json()) as { email?: string };
  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const ip = getClientIp(request);
  const rateLimit = await checkOtpSendRateLimit(ip, email);
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: "rate_limited",
        message: "Too many code requests. Try again shortly.",
        retryAfterMs: rateLimit.retryAfterMs,
      },
      { status: 429 }
    );
  }

  const tenantSlug = process.env.WARRANTINI_TENANT_SLUG;
  if (!tenantSlug) {
    throw new Error("WARRANTINI_TENANT_SLUG is not configured");
  }

  const { status, data, narration } = await callWarrantini<SendOtpResponseBody>({
    method: "POST",
    path: "/api/v1/customer/auth/send-otp",
    body: { email, tenantSlug },
  });

  // `code` only appears when Warrantini's own tenant is in sandbox/dev mode —
  // that's their own safeguard, and it belongs to the same visitor who just
  // requested it, so we pass it through faithfully rather than re-gating it.
  return NextResponse.json({ ...data, narration }, { status });
}
