import { NextRequest, NextResponse } from "next/server";

import { CUSTOMER_SESSION_COOKIE } from "@/lib/customer-session";
import { checkClaimsReadRateLimit, getClientIp } from "@/lib/rate-limit";
import { callWarrantini } from "@/lib/warrantini-client";

export type CustomerClaim = {
  id: string;
  tenantId: string;
  registrationId: string;
  status: "submitted" | "in_review" | "approved" | "rejected" | "info_requested" | "escalated";
  inspectionStatus: string | null;
  description: string;
  resolutionType: string | null;
  isReturnRequired: boolean;
  assignedTo: string | null;
  coverageOverride: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  productTitle: string | null;
  orderNumber: string | null;
};

type ListResponseBody = {
  data: CustomerClaim[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export async function GET(request: NextRequest) {
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

  const page = request.nextUrl.searchParams.get("page") ?? "1";
  const pageSize = request.nextUrl.searchParams.get("pageSize") ?? "20";

  const { status, data, narration } = await callWarrantini<ListResponseBody>({
    method: "GET",
    path: `/api/v1/customer/claims?page=${page}&pageSize=${pageSize}`,
    customerToken: token,
  });

  if (status === 401) {
    return NextResponse.json({ gate: "otp", narration }, { status: 401 });
  }

  return NextResponse.json({ ...data, narration }, { status });
}
