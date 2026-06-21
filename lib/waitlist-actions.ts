"use server";

import { exec } from "./db";
import { rateLimit } from "./rate-limit";
import { captureError } from "./observability";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface WaitlistResult {
  ok: boolean;
  message: string;
}

/** Capture an early-access email. Idempotent on the address. Rate-limited. */
export async function joinWaitlist(_prev: WaitlistResult | null, formData: FormData): Promise<WaitlistResult> {
  if (!(await rateLimit("waitlist", 5, 60_000))) {
    return { ok: false, message: "Too many attempts — please try again in a minute." };
  }
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 200) {
    return { ok: false, message: "Please enter a valid email address." };
  }
  try {
    await exec(
      "INSERT INTO waitlist (email, created_at, source) VALUES (?, ?, ?) ON CONFLICT(email) DO NOTHING",
      [email, new Date().toISOString(), "landing"]
    );
    return { ok: true, message: "You're on the list — we'll email you when early access opens." };
  } catch (e) {
    captureError(e, { where: "joinWaitlist" });
    return { ok: false, message: "Something went wrong saving that. Please try again." };
  }
}
