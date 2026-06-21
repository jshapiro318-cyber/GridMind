import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { auth } from "@/auth";
import { GUEST_COOKIE } from "./tenant";

const GUEST_RE = /^[a-z0-9]{6,40}$/i;

/**
 * The org an action should WRITE to. Signed-in → their tenant. Otherwise a
 * per-visitor guest workspace — created (and its cookie set) on first use. This
 * is how a signed-out visitor can input their own data without an account, fully
 * isolated from the shared demo (which never receives real data).
 */
export async function resolveWritableOrg(): Promise<string> {
  try {
    const session = await auth();
    if (session?.user?.orgId) return session.user.orgId;
  } catch {
    /* fall through to guest */
  }
  const jar = await cookies();
  let guest = jar.get(GUEST_COOKIE)?.value;
  if (!guest || !GUEST_RE.test(guest)) {
    guest = randomBytes(12).toString("hex");
    jar.set(GUEST_COOKIE, guest, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return `guest:${guest}`;
}

/** Drop the guest workspace → the visitor returns to the shared sample demo. */
export async function clearGuestWorkspace(): Promise<void> {
  (await cookies()).delete(GUEST_COOKIE);
}
