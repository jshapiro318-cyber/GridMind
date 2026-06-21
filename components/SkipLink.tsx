/** Visually-hidden "skip to content" link — first focusable element on the page. */
export function SkipLink({ targetId = "main" }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only rounded-lg border border-brand/50 bg-bg-raised px-4 py-2 text-sm font-medium text-ink shadow-card focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200]"
    >
      Skip to main content
    </a>
  );
}
