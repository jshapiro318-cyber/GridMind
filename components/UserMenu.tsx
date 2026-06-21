"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { doSignOut } from "@/lib/auth-actions";

export type SessionUser = { name?: string | null; email?: string | null; image?: string | null };

function initials(u: SessionUser): string {
  const fromName = u.name?.trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join("");
  return (fromName || u.email?.[0] || "U").toUpperCase();
}

export function UserMenu({ user }: { user: SessionUser | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (!user) {
    return (
      <Link href="/signin" className="pill transition-colors hover:border-line-bright hover:text-ink">
        Sign in
      </Link>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-line bg-bg-card text-xs font-medium text-ink transition-colors hover:border-line-bright"
        aria-label="Account menu"
        aria-expanded={open}
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          initials(user)
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-56 rounded-lg border border-line bg-bg-card p-2 shadow-card">
          <div className="px-2 py-1.5">
            <div className="truncate text-sm text-ink">{user.name ?? "Signed in"}</div>
            {user.email && <div className="truncate text-xs text-ink-faint">{user.email}</div>}
          </div>
          <div className="my-1 h-px bg-line" />
          <form action={doSignOut}>
            <button className="w-full rounded-md px-2 py-1.5 text-left text-sm text-ink-muted transition-colors hover:bg-bg-hover hover:text-ink">
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
