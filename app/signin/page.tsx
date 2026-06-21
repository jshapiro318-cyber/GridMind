import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, authConfigured, configuredProviders } from "@/auth";
import { signInWith } from "@/lib/auth-actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sign in · GridMind" };

const PROVIDER_MARK: Record<string, string> = { google: "G", github: "" };

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="app-backdrop flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-sm font-bold text-bg">G</span>
          <span className="text-lg font-semibold tracking-tight text-ink">GridMind</span>
        </Link>

        <div className="card card-pad">
          <h1 className="text-center text-lg font-semibold tracking-tight text-ink">Sign in to your workspace</h1>
          <p className="mt-1.5 text-center text-sm text-ink-muted">
            Connect your clouds and see your own spend, carbon and GridScore.
          </p>

          {authConfigured ? (
            <div className="mt-6 flex flex-col gap-2.5">
              {configuredProviders.map((p) => (
                <form
                  key={p.id}
                  action={async () => {
                    "use server";
                    await signInWith(p.id);
                  }}
                >
                  <button className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-line bg-bg-card px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-line-bright hover:bg-bg-hover">
                    {PROVIDER_MARK[p.id] && <span className="font-semibold text-brand">{PROVIDER_MARK[p.id]}</span>}
                    Continue with {p.label}
                  </button>
                </form>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-lg border border-line bg-bg p-3.5 text-xs leading-relaxed text-ink-muted">
              Sign-in isn&apos;t configured on this deployment yet. Set <span className="font-mono text-ink">AUTH_GOOGLE_ID</span>
              {" / "}<span className="font-mono text-ink">AUTH_GITHUB_ID</span> (see <span className="font-mono text-ink">.env.example</span>)
              to enable accounts. You can explore everything in the demo without one.
            </div>
          )}

          <div className="mt-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-ink-faint">
            <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
          </div>

          <Link
            href="/dashboard"
            className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-line px-4 py-2.5 text-sm text-ink-muted transition-colors hover:border-line-bright hover:text-ink"
          >
            Continue to the demo
            <span aria-hidden>→</span>
          </Link>
          <p className="mt-3 text-center text-[11px] text-ink-faint">
            The demo runs on a built-in sample fleet — no account, no sign-up.
          </p>
        </div>
        <p className="mt-5 text-center text-[11px] leading-relaxed text-ink-faint">
          By continuing you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2 hover:text-ink-muted">Terms</Link> and{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-ink-muted">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
