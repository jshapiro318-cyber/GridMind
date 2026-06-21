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
