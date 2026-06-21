import "server-only";
import { headers } from "next/headers";

// In-memory fixed-window rate limiter keyed by client IP. NOTE: per-process
// only — correct for a single instance / this prototype. A multi-instance
// production deploy should swap this for a shared store (Upstash/Redis). Fails
// OPEN on header errors (never blocks a legit user because IP was unreadable).
const buckets = new Map<string, { count: number; reset: number }>();

async function clientIp(): Promise<string> {
  try {
    const h = await headers();
    return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
  } catch {
    return "unknown";
  }
}

/** Returns true if the action is allowed, false if the IP is over the limit. */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const id = `${key}:${await clientIp()}`;
  const now = Date.now();
  const b = buckets.get(id);
  if (!b || now > b.reset) {
    buckets.set(id, { count: 1, reset: now + windowMs });
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (now > v.reset) buckets.delete(k);
    }
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}
