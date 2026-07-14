import { NextRequest, NextResponse } from "next/server";

import { CUSTOMER_SESSION_COOKIE } from "@/lib/customer-session";
import { checkClaimsReadRateLimit, getClientIp } from "@/lib/rate-limit";
import { callWarrantini } from "@/lib/warrantini-client";
import type { CustomerClaim } from "../route";

type DetailResponseBody = {
  claim: CustomerClaim;
  events: unknown[];
  attachments: unknown[];
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ gate: "otp" }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rateLimit = await checkClaimsReadRateLimit(ip);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many requests.", retryAfterMs: rateLimit.retryAfterMs },
      { status: 429 }
    );
  }

  const { status, data, narration } = await callWarrantini<DetailResponseBody>({
    method: "GET",
    path: `/api/v1/customer/claims/${encodeURIComponent(id)}`,
    customerToken: token,
  });

  if (status === 401) {
    return NextResponse.json({ gate: "otp", narration }, { status: 401 });
  }

  return NextResponse.json({ ...data, narration }, { status });
}
