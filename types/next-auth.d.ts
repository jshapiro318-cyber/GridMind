import type { DefaultSession } from "next-auth";

// Expose the derived org id on the session + JWT so per-org data scoping is typed.
declare module "next-auth" {
  interface Session {
    user: { orgId?: string } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    orgId?: string;
  }
}
