import { NextRequest, NextResponse } from "next/server";

import { CUSTOMER_SESSION_COOKIE } from "@/lib/customer-session";
import { checkOrdersReadRateLimit, getClientIp } from "@/lib/rate-limit";
import { callWarrantini } from "@/lib/warrantini-client";

export type CustomerOrderLineItem = {
  id: string;
  sku: string | null;
  productTitle: string;
  productType: string | null;
  category: string | null;
  vendor: string | null;
  quantity: number;
  price: string;
  fulfillmentStatus: string;
  imageUrl: string | null;
  coverageStatus: "included" | "excluded" | "expired" | "registered" | "no_match";
  coverageMonths: number | null;
  coverageEnds: string | null;
  resolutionType: string | null;
  isReturnRequired: boolean | null;
  ruleName: string | null;
  registrationId: string | null;
};

export type CustomerOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  orderedAt: string;
  fulfilledAt: string | null;
  status: string;
  lineItems: CustomerOrderLineItem[];
};

type ListResponseBody = {
  data: CustomerOrder[];
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
  const rateLimit = await checkOrdersReadRateLimit(ip);
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
    path: `/api/v1/customer/orders?page=${page}&pageSize=${pageSize}`,
    customerToken: token,
  });

  if (status === 401) {
    return NextResponse.json({ gate: "otp", narration }, { status: 401 });
  }

  return NextResponse.json({ ...data, narration }, { status });
}
