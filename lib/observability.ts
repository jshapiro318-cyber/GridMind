// Central error capture. Today it emits one structured JSON line per error
// (easy to ship to any log drain / CloudWatch / Logtail). To turn on Sentry:
//   1. npm i @sentry/nextjs && npx @sentry/wizard@latest -i nextjs
//   2. set SENTRY_DSN
//   3. uncomment the forward block below.
// Kept dependency-free so it's safe to import from server actions, the data
// layer, and instrumentation (any runtime) without pulling a heavy SDK.

export interface ErrorContext {
  where: string;
  [key: string]: unknown;
}

const sentryEnabled = !!process.env.SENTRY_DSN;

export function captureError(error: unknown, context: ErrorContext): void {
  const err = error instanceof Error ? error : new Error(String(error));
  const record = {
    level: "error",
    ts: new Date().toISOString(),
    message: err.message,
    stack: err.stack,
    ...context,
  };
  // Structured, single-line — greppable and drain-friendly.
  console.error("[gridmind:error]", JSON.stringify(record));

  if (sentryEnabled) {
    // import("@sentry/nextjs").then((S) => S.captureException(err, { extra: context })).catch(() => {});
  }
}

export function isObservabilityConfigured(): boolean {
  return sentryEnabled;
}

export type LogLevel = "info" | "warn" | "error";

/**
 * Structured event log — one greppable JSON line per event, to stdout/stderr
 * (Vercel captures these in the project's Logs / Observability tab, and they
 * ship cleanly to any log drain). Use for business + lifecycle events
 * (checkout, sync, subscription changes) so there's a trail when there's real
 * traffic. Errors should still go through captureError().
 *
 *   logEvent("info", "checkout.started", { orgId, plan })
 */
export function logEvent(level: LogLevel, event: string, fields: Record<string, unknown> = {}): void {
  const line = `[gridmind:${level}] ` + JSON.stringify({ level, ts: new Date().toISOString(), event, ...fields });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}
