import Link from "next/link";

export const metadata = { title: "Not found · GridMind" };

export default function NotFound() {
  return (
    <div className="app-backdrop flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <div className="text-[5rem] font-bold leading-none text-brand">404</div>
        <h1 className="mt-2 text-lg font-semibold text-ink">Page not found</h1>
        <p className="mt-1.5 text-sm text-ink-muted">That page doesn&apos;t exist or has moved.</p>
        <div className="mt-6 flex justify-center gap-2.5">
          <Link href="/dashboard" className="btn btn-primary btn-sm">Open dashboard</Link>
          <Link href="/" className="btn btn-ghost btn-sm">Back home</Link>
        </div>
      </div>
    </div>
  );
}
