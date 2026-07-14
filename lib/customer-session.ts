import type { NextResponse } from "next/server";

export const CUSTOMER_SESSION_COOKIE = "warrantini_customer_jwt";

// Warrantini's customer JWT is valid for 1 hour. We set the cookie to expire
// slightly sooner so it never outlives a token that would 401 anyway.
const COOKIE_MAX_AGE_SECONDS = 55 * 60;

export function setCustomerSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export function clearCustomerSessionCookie(response: NextResponse) {
  response.cookies.set(CUSTOMER_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
