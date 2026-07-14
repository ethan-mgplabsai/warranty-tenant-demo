import { NextRequest, NextResponse } from "next/server";

import { checkRulesReadRateLimit, getClientIp } from "@/lib/rate-limit";
import { callWarrantini } from "@/lib/warrantini-client";

export type WarrantyRuleCondition = {
  field: "sku" | "product_type" | "category" | "title" | "vendor";
  operator: "equals" | "contains" | "starts_with" | "ends_with" | "wildcard";
  value: string;
};

export type WarrantyRule = {
  id: string;
  name: string;
  rule_type: "include" | "exclude";
  conditions: {
    operator: "all" | "any";
    conditions: WarrantyRuleCondition[];
  };
  coverage_months: number | null;
  covers: string | null;
  exclusions: string | null;
  default_resolution_type: "repair" | "replace_part" | "replace_full" | "refund" | null;
  is_return_required: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
};

type ListResponseBody = {
  data: WarrantyRule[];
  pagination: { cursor: string | null; has_more: boolean; limit: number };
};

export async function GET(request: NextRequest) {
  const apiKey = process.env.DEMO_API_KEY;
  if (!apiKey) {
    throw new Error("DEMO_API_KEY is not configured");
  }

  const ip = getClientIp(request);
  const rateLimit = await checkRulesReadRateLimit(ip);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many requests.", retryAfterMs: rateLimit.retryAfterMs },
      { status: 429 }
    );
  }

  const { status, data, narration } = await callWarrantini<ListResponseBody>({
    method: "GET",
    // Rules lists are small tenant policy config, not paginated visitor data —
    // fetch the max page size in one call rather than building "load more" UI
    // for a page that's meant to read as a single policy document.
    path: "/api/v1/rules?limit=100",
    apiKey,
  });

  return NextResponse.json({ ...data, narration }, { status });
}
