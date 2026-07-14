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

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() ?? "127.0.0.1";
}

export type RateLimitResult = { success: true } | { success: false; retryAfterMs: number };

export async function checkOtpSendRateLimit(ip: string, email: string): Promise<RateLimitResult> {
  if (!otpSendIpLimiter || !otpSendEmailLimiter) return { success: true };

  const [ipResult, emailResult] = await Promise.all([
    otpSendIpLimiter.limit(ip),
    otpSendEmailLimiter.limit(email.toLowerCase()),
  ]);

  if (!ipResult.success) {
    return { success: false, retryAfterMs: Math.max(0, ipResult.reset - Date.now()) };
  }
  if (!emailResult.success) {
    return { success: false, retryAfterMs: Math.max(0, emailResult.reset - Date.now()) };
  }
  return { success: true };
}

export async function checkRegistrationsReadRateLimit(ip: string): Promise<RateLimitResult> {
  if (!registrationsReadLimiter) return { success: true };

  const result = await registrationsReadLimiter.limit(ip);
  if (!result.success) {
    return { success: false, retryAfterMs: Math.max(0, result.reset - Date.now()) };
  }
  return { success: true };
}
