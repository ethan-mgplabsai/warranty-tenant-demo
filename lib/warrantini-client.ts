export type NarrationEntry = {
  id: string;
  method: string;
  path: string;
  requestBody: unknown;
  responseStatus: number;
  responseBody: unknown;
  latencyMs: number;
  timestamp: string;
  /** Always a fixed placeholder or null — never a real credential. */
  authHeaderRedacted: string | null;
};

type CallWarrantiniOptions = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
  /** Customer JWT from the OTP flow. Never logged or returned in narration. */
  customerToken?: string;
  /** Plain-tier DEMO_API_KEY for tenant-wide /v1/* calls. Never logged or returned in narration. */
  apiKey?: string;
};

type CallWarrantiniResult<T> = {
  status: number;
  data: T;
  narration: NarrationEntry;
};

/**
 * Thin, instrumented wrapper around fetch() for calling Warrantini's public API
 * server-side. The real Authorization header only ever lives in a local variable
 * scoped to this function's own fetch() call — it is never attached to the
 * returned NarrationEntry, so callers structurally cannot leak it to the browser.
 */
export async function callWarrantini<T = unknown>(
  options: CallWarrantiniOptions
): Promise<CallWarrantiniResult<T>> {
  const { method, path, body, customerToken, apiKey } = options;
  const baseUrl = process.env.WARRANTINI_API_BASE_URL;
  if (!baseUrl) {
    throw new Error("WARRANTINI_API_BASE_URL is not configured");
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (customerToken) {
    headers.Authorization = `Bearer ${customerToken}`;
  } else if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const startedAt = Date.now();
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const latencyMs = Date.now() - startedAt;

  const rawText = await response.text();
  let data: T;
  try {
    data = rawText ? (JSON.parse(rawText) as T) : (null as T);
  } catch {
    data = rawText as unknown as T;
  }

  const narration: NarrationEntry = {
    id: crypto.randomUUID(),
    method,
    path,
    requestBody: body ?? null,
    responseStatus: response.status,
    responseBody: data,
    latencyMs,
    timestamp: new Date().toISOString(),
    authHeaderRedacted: customerToken || apiKey ? "Bearer ••••••••" : null,
  };

  return { status: response.status, data, narration };
}
