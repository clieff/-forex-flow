type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type WindowState = {
  count: number;
  resetAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __rateLimitStore: Map<string, WindowState> | undefined;
}

const store: Map<string, WindowState> = global.__rateLimitStore ?? new Map<string, WindowState>();
if (process.env.NODE_ENV !== "production") {
  global.__rateLimitStore = store;
}

export function getRequestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function checkRateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const next: WindowState = { count: 1, resetAt: now + windowMs };
    store.set(key, next);
    return { ok: true, remaining: limit - 1, resetAt: next.resetAt };
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  store.set(key, existing);
  return { ok: true, remaining: Math.max(0, limit - existing.count), resetAt: existing.resetAt };
}

