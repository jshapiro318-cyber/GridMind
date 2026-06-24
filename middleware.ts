import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Expose the request path to Server Components (the app-group layout reads it to
// exempt /billing from the subscription gate). Edge-safe: no auth or DB here.
export function middleware(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Run on app pages; skip Next internals, the API, and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
