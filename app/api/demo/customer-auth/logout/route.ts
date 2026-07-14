import { NextResponse } from "next/server";

import { clearCustomerSessionCookie } from "@/lib/customer-session";

// No upstream equivalent — this only clears our own local session cookie,
// unlike every other route under app/api/demo which mirrors one Warrantini endpoint.
export async function POST() {
  const response = NextResponse.json({ success: true });
  clearCustomerSessionCookie(response);
  return response;
}
