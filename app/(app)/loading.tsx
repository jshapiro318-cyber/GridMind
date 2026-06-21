// Instant loading state shown inside the app shell while a server-rendered view
// streams in (the app pages are dynamic / data-backed).
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-ink-muted">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <span className="text-sm">Loading…</span>
      </div>
    </div>
  );
}
