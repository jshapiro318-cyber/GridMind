"use client";

import { useActionState } from "react";
import { joinWaitlist, type WaitlistResult } from "@/lib/waitlist-actions";

export function WaitlistForm() {
  const [state, action, pending] = useActionState<WaitlistResult | null, FormData>(joinWaitlist, null);

  return (
    <div className="mx-auto mt-8 w-full max-w-md">
      <form action={action} className="flex flex-col gap-2.5 sm:flex-row">
        <input
          type="email"
          name="email"
          required
          placeholder="you@company.com"
          aria-label="Email for early access"
          className="min-w-0 flex-1 rounded-lg border border-[#b3bdd2] bg-white px-4 py-3 font-sans text-sm text-[#0b0e15] placeholder:text-[#8b93a3] focus:border-[#caa23a] focus:outline-none"
        />
        <button type="submit" disabled={pending} className="btn btn-primary px-5 py-3 disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? "Joining…" : "Join the waitlist"}
        </button>
      </form>
      {state ? (
        <p className={`mt-2.5 font-sans text-sm ${state.ok ? "text-[#0c8f59]" : "text-[#b9591f]"}`}>{state.message}</p>
      ) : (
        <p className="mt-2.5 font-sans text-xs text-[#8b93a3]">No spam — one email when early access opens.</p>
      )}
    </div>
  );
}
