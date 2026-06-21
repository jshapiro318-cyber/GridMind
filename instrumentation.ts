// Next.js instrumentation — central server-side error capture. onRequestError
// fires for any unhandled error during a request (RSC render, route handler,
// server action), so failures are logged structurally in one place.

export async function register(): Promise<void> {
  // reserved for future tracing / SDK init
}

type RequestInfo = { path?: string; method?: string };
type ErrorContext = { routerKind?: string; routePath?: string; routeType?: string };

export async function onRequestError(error: unknown, request: RequestInfo, context: ErrorContext): Promise<void> {
  const { captureError } = await import("./lib/observability");
  captureError(error, {
    where: "request",
    path: request?.path,
    method: request?.method,
    route: context?.routePath,
    routeType: context?.routeType,
  });
}
