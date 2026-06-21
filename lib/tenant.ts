import "server-only";
import { cache } from "react";
import { auth } from "@/auth";
import { DEMO_ORG } from "./db";

/**
 * The org id for the current request, resolved once (React cache) from the
 * session. Signed-out visitors get the public 'demo' org; signed-in users get
 * their own tenant (orgIdFromEmail). Every data query scopes to this id.
 */
export const getCurrentOrgId = cache(async (): Promise<string> => {
  try {
    const session = await auth();
    return session?.user?.orgId ?? DEMO_ORG;
  } catch {
    return DEMO_ORG;
  }
});
