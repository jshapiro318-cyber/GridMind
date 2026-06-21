import { randomBytes } from "node:crypto";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

// ─────────────────────────────────────────────────────────────────────────────
// Auth.js (NextAuth v5) — Google + GitHub sign-in.
//
// Providers are only enabled when their credentials are present in the env, so
// the app builds and runs with NO auth configured: in that case it's "demo
// only" — the public sample workspace works, and the sign-in page explains how
// to enable accounts. Credentials live entirely in the environment; we never
// see or store a user's password (OAuth only).
// ─────────────────────────────────────────────────────────────────────────────

type ProviderMeta = { id: string; label: string };

const providerNodes: NextAuthConfig["providers"] = [];
const providerMeta: ProviderMeta[] = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providerNodes.push(Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET }));
  providerMeta.push({ id: "google", label: "Google" });
}
if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providerNodes.push(GitHub({ clientId: process.env.AUTH_GITHUB_ID, clientSecret: process.env.AUTH_GITHUB_SECRET }));
  providerMeta.push({ id: "github", label: "GitHub" });
}

/** Provider ids/labels actually configured via env — drives the sign-in page. */
export const configuredProviders: ProviderMeta[] = providerMeta;
/** True when at least one OAuth provider is configured (else: demo-only mode). */
export const authConfigured = providerMeta.length > 0;

// NEVER ship a hardcoded secret (it would let anyone forge session JWTs). When
// AUTH_SECRET is unset we mint a per-process random one: dev works, and in prod
// it's still unforgeable from source — only downside is sessions don't survive a
// restart / span instances, so set AUTH_SECRET in production.
const AUTH_SECRET = process.env.AUTH_SECRET ?? randomBytes(32).toString("base64");
if (!process.env.AUTH_SECRET) {
  console.warn(
    process.env.NODE_ENV === "production"
      ? "[gridmind] AUTH_SECRET is NOT set — using an ephemeral secret; sessions will not persist across restarts/instances. Set AUTH_SECRET before serving real users."
      : "[gridmind] AUTH_SECRET not set — using an ephemeral dev secret."
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: providerNodes,
  trustHost: true,
  secret: AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  callbacks: {
    jwt({ token, profile }) {
      if (profile?.email) {
        token.email = profile.email;
        token.orgId = orgIdFromEmail(profile.email);
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.orgId = (token.orgId as string | undefined) ?? "demo";
      return session;
    },
  },
});

/**
 * Stable per-tenant id derived from the user's email. Teammates on the same
 * company domain share one org; personal-email users each get their own. This
 * is the key that per-org data scoping (the usage table's org_id) will filter on.
 */
export function orgIdFromEmail(email: string): string {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  const personal = new Set(["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com", "proton.me", "me.com"]);
  if (!domain || personal.has(domain)) return `u:${email.toLowerCase()}`;
  return `org:${domain}`;
}
