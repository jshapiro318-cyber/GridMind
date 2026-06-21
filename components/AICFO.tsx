"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { CFOAnswer } from "@/lib/cfo";
import { loadCFOBriefing } from "@/lib/cfo-actions";

type Briefing = { greeting: string; answers: CFOAnswer[] };

const TONE: Record<string, string> = {
  good: "#3fe39a",
  warn: "#e8a33c",
  bad: "#ff5d5d",
  neutral: "#ecb84c",
};

export function AICFO() {
  const [open, setOpen] = useState(false);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [asked, setAsked] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const bodyRef = useRef<HTMLDivElement>(null);

  // Load the briefing the first time the panel opens.
  useEffect(() => {
    if (open && !briefing && !pending) {
      startTransition(async () => setBriefing(await loadCFOBriefing()));
    }
  }, [open, briefing, pending]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [asked, briefing]);

  const ask = (id: string) => setAsked((a) => (a.includes(id) ? a : [...a, id]));
  const remaining = briefing?.answers.filter((a) => !asked.includes(a.id)) ?? [];

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open AI CFO assistant"
        className="press fixed bottom-5 right-5 z-[90] flex items-center gap-2.5 rounded-full border border-brass/40 bg-bg-raised/95 py-2.5 pl-2.5 pr-4 shadow-card backdrop-blur transition-colors hover:border-brass/60"
      >
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brass to-[#b8801f] text-bg">
          <CFOMark />
          {!open && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulseNode rounded-full bg-brand ring-2 ring-bg-raised" />}
        </span>
        <span className="text-sm font-semibold text-ink">AI CFO</span>
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-[90] flex max-h-[min(640px,80vh)] w-[min(400px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-line-bright bg-bg-card/98 shadow-card backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-line bg-bg-raised/60 px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brass to-[#b8801f] text-bg">
              <CFOMark />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-ink">AI CFO</h3>
                <span className="rounded-full border border-brass/30 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-brass">Beta</span>
              </div>
              <p className="text-[11px] text-ink-faint">Understands your entire infrastructure</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="press rounded-md p-1 text-ink-faint hover:text-ink">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
          </div>

          {/* Thread */}
          <div ref={bodyRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {!briefing && (
              <div className="flex items-center gap-2 text-xs text-ink-faint">
                <span className="h-3 w-3 animate-spin rounded-full border border-brass border-t-transparent" />
                Reading your infrastructure…
              </div>
            )}
            {briefing && <Bubble>{briefing.greeting}</Bubble>}
            {briefing &&
              asked.map((id) => {
                const a = briefing.answers.find((x) => x.id === id);
                if (!a) return null;
                return (
                  <div key={id} className="space-y-2">
                    <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md border border-brand/30 bg-brand/10 px-3 py-2 text-xs text-ink">
                      {a.question}
                    </div>
                    <div className="rounded-2xl rounded-bl-md border border-line bg-bg-raised px-3.5 py-3">
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="tnum text-lg font-semibold" style={{ color: TONE[a.tone] }}>{a.headline}</span>
                      </div>
                      <p className="text-xs leading-relaxed text-ink-muted">{a.answer}</p>
                      <ul className="mt-2.5 space-y-1.5 border-t border-line/60 pt-2.5">
                        {a.points.map((p, i) => (
                          <li key={i} className="flex gap-2 text-[11px] text-ink-faint">
                            <span className="mt-1 h-1 w-1 shrink-0 rounded-full" style={{ background: TONE[a.tone] }} />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Suggested questions */}
          {briefing && (
            <div className="border-t border-line bg-bg-raised/40 px-3 py-3">
              <div className="stat-label mb-2 px-1">{remaining.length ? "Suggested questions" : "Ask anything else from the dashboards"}</div>
              <div className="flex flex-col gap-1.5">
                {remaining.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => ask(a.id)}
                    className="press flex items-center justify-between gap-2 rounded-lg border border-line bg-bg-card px-3 py-2 text-left text-xs text-ink-muted transition-colors hover:border-brass/40 hover:text-ink"
                  >
                    <span>{a.question}</span>
                    <span className="text-ink-faint">→</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function Bubble({ children }: { children: React.ReactNode }) {
  return <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-line bg-bg-raised px-3.5 py-2.5 text-xs leading-relaxed text-ink-muted">{children}</div>;
}

function CFOMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.6l1.5 3.9 4.1.3-3.2 2.6 1 4-3.4-2.2-3.4 2.2 1-4-3.2-2.6 4.1-.3L8 1.6z" fill="currentColor" />
    </svg>
  );
}
