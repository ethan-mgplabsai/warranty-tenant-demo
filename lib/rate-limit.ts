import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

// Upstash isn't configured in every environment this demo runs in (e.g. local
// dev before secrets are provisioned). Fail open with a warning rather than
// 500 every request — CLAUDE.md's own rate-limit rule is a defense-in-depth
// layer on top of the upstream key's limit, not the only thing standing
// between the app and abuse.
const upstashConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);
if (!upstashConfigured) {
  console.warn("[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting is disabled.");
}

const redis = upstashConfigured ? Redis.fromEnv() : null;

// OTP send is the real abuse vector: a visitor could spam an arbitrary
// third party's inbox. Gate on both the requesting IP (looser) and the
// submitted email (strict) — reject if either trips.
const otpSendIpLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "10 m"), prefix: "rl:otp-send:ip" })
  : null;
const otpSendEmailLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, "10 m"), prefix: "rl:otp-send:email" })
  : null;

// Reads behind a JWT are much lower risk — generous limit, IP-keyed.
const registrationsReadLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "1 m"), prefix: "rl:regs-read" })
  : null;
const ordersReadLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "1 m"), prefix: "rl:orders-read" })
  : null;

// This is the first *write* endpoint against the shared demo tenant's API key —
// tighter than the read limiters since every visitor to the site shares the same
// upstream budget.
const registrationsWriteLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 m"), prefix: "rl:regs-write" })
  : null;

// Warranty rules are shared tenant policy config (same for every visitor), not
// per-customer data — generous limit, IP-keyed, same risk profile as the other
// read endpoints.
const rulesReadLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "1 m"), prefix: "rl:rules-read" })
  : null;

// The published policy endpoint needs no upstream credential at all, but it's
// still our own public route hitting the shared demo tenant — keep the same
// generous IP-keyed limit as the other read endpoints as defense-in-depth.
const warrantyPolicyReadLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "1 m"), prefix: "rl:policy-read" })
  : null;

// Reads behind a JWT — same risk profile as registrations/orders reads.
const claimsReadLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "1 m"), prefix: "rl:claims-read" })
  : null;

// Replying to an info request is a write against the shared demo tenant —
// tighter, same rationale as registrations-write.
const claimsReplyLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 m"), prefix: "rl:claims-reply" })
  : null;

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() ?? "127.0.0.1";
}

export type RateLimitResult = { success: true } | { success: false; retryAfterMs: number };

async function checkRateLimit(limiter: Ratelimit | null, key: string): Promise<RateLimitResult> {
  if (!limiter) return { success: true };

  try {
    const result = await limiter.limit(key);
    if (!result.success) {
      return { success: false, retryAfterMs: Math.max(0, result.reset - Date.now()) };
    }
    return { success: true };
  } catch (error) {
    // Same fail-open philosophy as the "not configured" case above: a Redis-side
    // failure (permissions, outage, network) shouldn't 500 every request this
    // layer touches — this is defense-in-depth on top of the upstream key's own
    // limit, not the only thing standing between the app and abuse.
    console.warn("[rate-limit] limiter call failed, failing open:", error);
    return { success: true };
  }
}

export async function checkOtpSendRateLimit(ip: string, email: string): Promise<RateLimitResult> {
  if (!otpSendIpLimiter || !otpSendEmailLimiter) return { success: true };

  const [ipResult, emailResult] = await Promise.all([
    checkRateLimit(otpSendIpLimiter, ip),
    checkRateLimit(otpSendEmailLimiter, email.toLowerCase()),
  ]);

  if (!ipResult.success) return ipResult;
  if (!emailResult.success) return emailResult;
  return { success: true };
}

export function checkRegistrationsReadRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(registrationsReadLimiter, ip);
}

export function checkOrdersReadRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(ordersReadLimiter, ip);
}

export function checkRegistrationsWriteRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(registrationsWriteLimiter, ip);
}

export function checkRulesReadRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(rulesReadLimiter, ip);
}

export function checkWarrantyPolicyReadRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(warrantyPolicyReadLimiter, ip);
}

export function checkClaimsReadRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(claimsReadLimiter, ip);
}

export function checkClaimsReplyRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(claimsReplyLimiter, ip);
}
