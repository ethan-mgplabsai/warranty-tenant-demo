import { NextRequest, NextResponse } from "next/server";

import { checkWarrantyPolicyReadRateLimit, getClientIp } from "@/lib/rate-limit";
import { callWarrantini } from "@/lib/warrantini-client";

export type PublishedWarrantyPolicy = {
  title: string;
  content: string;
  updatedAt: string;
};

export async function GET(request: NextRequest) {
  const tenantSlug = process.env.WARRANTINI_TENANT_SLUG;
  if (!tenantSlug) {
    throw new Error("WARRANTINI_TENANT_SLUG is not configured");
  }

  const ip = getClientIp(request);
  const rateLimit = await checkWarrantyPolicyReadRateLimit(ip);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many requests.", retryAfterMs: rateLimit.retryAfterMs },
      { status: 429 }
    );
  }

  // Public endpoint — no customer JWT or API key required.
  const { status, data, narration } = await callWarrantini<PublishedWarrantyPolicy>({
    method: "GET",
    path: `/api/v1/customer/warranty-policy?slug=${encodeURIComponent(tenantSlug)}`,
  });

  return NextResponse.json({ ...data, narration }, { status });
}
