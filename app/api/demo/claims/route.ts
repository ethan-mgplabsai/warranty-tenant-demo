import { NextRequest, NextResponse } from "next/server";

import { CUSTOMER_SESSION_COOKIE } from "@/lib/customer-session";
import { checkClaimsReadRateLimit, checkClaimsWriteRateLimit, getClientIp } from "@/lib/rate-limit";
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

type CreateClaimRequestBody = {
  registrationId: string;
  description: string;
};

export async function POST(request: NextRequest) {
  const token = request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ gate: "otp" }, { status: 401 });
  }

  let body: CreateClaimRequestBody;
  try {
    body = (await request.json()) as CreateClaimRequestBody;
  } catch {
    return NextResponse.json({ error: "invalid_body", message: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!body.registrationId || typeof body.registrationId !== "string") {
    return NextResponse.json({ error: "invalid_body", message: "registrationId is required." }, { status: 400 });
  }
  if (!body.description || typeof body.description !== "string" || body.description.trim().length < 20) {
    return NextResponse.json(
      { error: "invalid_body", message: "description must be at least 20 characters." },
      { status: 400 }
    );
  }

  const ip = getClientIp(request);
  const rateLimit = await checkClaimsWriteRateLimit(ip);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many requests.", retryAfterMs: rateLimit.retryAfterMs },
      { status: 429 }
    );
  }

  const { status, data, narration } = await callWarrantini<CustomerClaim>({
    method: "POST",
    path: "/api/v1/customer/claims",
    body,
    customerToken: token,
  });

  if (status === 401) {
    return NextResponse.json({ gate: "otp", narration }, { status: 401 });
  }

  return NextResponse.json({ ...data, narration }, { status });
}
