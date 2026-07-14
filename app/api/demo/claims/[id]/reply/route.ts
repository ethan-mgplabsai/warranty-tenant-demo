import { NextRequest, NextResponse } from "next/server";

import { CUSTOMER_SESSION_COOKIE } from "@/lib/customer-session";
import { checkClaimsReplyRateLimit, getClientIp } from "@/lib/rate-limit";
import { callWarrantini } from "@/lib/warrantini-client";

type ReplyRequestBody = {
  message: string;
};

type ReplyResponseBody = {
  success: boolean;
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ gate: "otp" }, { status: 401 });
  }

  let body: ReplyRequestBody;
  try {
    body = (await request.json()) as ReplyRequestBody;
  } catch {
    return NextResponse.json({ error: "invalid_body", message: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!body.message || typeof body.message !== "string" || body.message.trim().length === 0) {
    return NextResponse.json({ error: "invalid_body", message: "message is required." }, { status: 400 });
  }

  const ip = getClientIp(request);
  const rateLimit = await checkClaimsReplyRateLimit(ip);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many requests.", retryAfterMs: rateLimit.retryAfterMs },
      { status: 429 }
    );
  }

  const { status, data, narration } = await callWarrantini<ReplyResponseBody>({
    method: "POST",
    path: `/api/v1/customer/claims/${encodeURIComponent(id)}/reply`,
    body,
    customerToken: token,
  });

  if (status === 401) {
    return NextResponse.json({ gate: "otp", narration }, { status: 401 });
  }

  return NextResponse.json({ ...data, narration }, { status });
}
