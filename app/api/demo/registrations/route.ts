import { NextRequest, NextResponse } from "next/server";

import { CUSTOMER_SESSION_COOKIE } from "@/lib/customer-session";
import { checkRegistrationsReadRateLimit, getClientIp } from "@/lib/rate-limit";
import { callWarrantini } from "@/lib/warrantini-client";

export type CustomerRegistration = {
  id: string;
  tenantId: string;
  orderId: string;
  lineItemId: string;
  customerEmail: string;
  serialNumber: string | null;
  status: string;
  warrantyRuleId: string;
  coverageStarts: string;
  coverageEnds: string | null;
  usageLimitMetric: string | null;
  usageLimitValue: number | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  productTitle: string;
  sku: string | null;
  productType: string | null;
  orderNumber: string | null;
};

type ListResponseBody = {
  data: CustomerRegistration[];
  pagination: { page: number; pageSize: number; total?: number };
};

export async function GET(request: NextRequest) {
  const token = request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ gate: "otp" }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rateLimit = await checkRegistrationsReadRateLimit(ip);
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
    path: `/api/v1/customer/registrations?page=${page}&pageSize=${pageSize}`,
    customerToken: token,
  });

  if (status === 401) {
    return NextResponse.json({ gate: "otp", narration }, { status: 401 });
  }

  return NextResponse.json({ ...data, narration }, { status });
}
