import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { DEMO_ORG } from "./db";

export const GUEST_COOKIE = "gm_guest";

const GUEST_RE = /^[a-z0-9]{6,40}$/i;

/**
 * The org id for the current request, resolved once (React cache):
 *  - signed in        → their tenant
 *  - guest cookie set → a private per-visitor workspace (`guest:<id>`)
 *  - otherwise        → the public 'demo' org (shared sample fleet)
 * Every data query scopes to this id, so guests' data is isolated and never
 * touches the demo.
 */
export const getCurrentOrgId = cache(async (): Promise<string> => {
  try {
    const session = await auth();
    if (session?.user?.orgId) return session.user.orgId;
  } catch {
    /* fall through */
  }
  try {
    const guest = (await cookies()).get(GUEST_COOKIE)?.value;
    if (guest && GUEST_RE.test(guest)) return `guest:${guest}`;
  } catch {
    /* fall through */
  }
  return DEMO_ORG;
});
