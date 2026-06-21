"use client";

import { useEffect } from "react";
import Link from "next/link";

// Error boundary for the authenticated/app surfaces. Keeps the shell intact and
// gives the user a way out instead of a blank screen when a view throws.
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Client-side breadcrumb; server errors are captured centrally via instrumentation.
    console.error("[gridmind] view error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="card card-pad max-w-md text-center">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-amber/40 bg-amber/10 text-amber">!</span>
        <h1 className="mt-3 text-lg font-semibold tracking-tight text-ink">This view hit an error</h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          Something failed while loading this page. Try again, or head back to the dashboard.
          {error.digest ? <span className="mt-1.5 block font-mono text-[11px] text-ink-faint">ref: {error.digest}</span> : null}
        </p>
        <div className="mt-5 flex justify-center gap-2.5">
          <button onClick={() => reset()} className="btn btn-primary btn-sm">Try again</button>
          <Link href="/dashboard" className="btn btn-ghost btn-sm">Back to dashboard</Link>
        </div>
      </div>
    </div>
  );
}
