import Link from "next/link";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Security & Trust · GridMind",
  description:
    "How GridMind handles your cloud credentials and cost data: read-only, least-privilege, recommend-only, and your keys never leave your own environment.",
  alternates: { canonical: `${SITE_URL}/security` },
};

const PILLARS = [
  {
    k: "We never store your cloud keys",
    v: "There is no place in GridMind to type a cloud key, and no credential column in our database. Provider credentials live as environment variables in your own deployment; GridMind reads them server-side to call each provider's billing API, and never transmits, persists, or logs them.",
  },
  {
    k: "Read-only, least privilege",
    v: "Every integration asks for a single read-only billing scope — nothing more. GridMind can read what you spent. It cannot create, modify, move, stop, or delete a single resource in your account.",
  },
  {
    k: "Recommendations, not actions",
    v: "GridMind produces a plan — where each workload runs cheapest. It never executes a migration or touches a running workload. “Route in one click” generates a recommendation you act on yourself. You stay in control.",
  },
];

const SCOPES = [
  { p: "Amazon Web Services", grant: "Cost Explorer, read-only", scope: "IAM: ce:GetCostAndUsage" },
  { p: "Google Cloud", grant: "BigQuery billing export, read-only", scope: "bigquery.readonly · Data Viewer + Job User" },
  { p: "Microsoft Azure", grant: "Cost Management, read-only", scope: "Role: Cost Management Reader" },
  { p: "Neoclouds (CoreWeave, Lambda, …)", grant: "A read-only cost feed", scope: "Read-only API key / JSON feed" },
];

export default function SecurityPage() {
  return (
    <div className="app-backdrop min-h-screen">
      <div className="mx-auto max-w-3xl px-5 py-16 sm:py-20">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm text-ink-faint transition-colors hover:text-ink-muted">← GridMind</Link>
          <span className="rounded-full border border-line px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">Security &amp; trust</span>
        </div>

        <h1 className="mt-7 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Security &amp; Trust</h1>
        <p className="mt-2 text-sm text-ink-faint">Last reviewed June 21, 2026</p>
        <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
          To find savings, GridMind needs to see what you spend on AI compute — and we&apos;ve built it to need as
          little trust as possible to do that. The short version: it&apos;s read-only, it recommends rather than acts,
          and your cloud keys never leave your own environment. Here&apos;s exactly how that works.
        </p>

        {/* Three pillars */}
        <div className="mt-9 grid gap-3 sm:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.k} className="rounded-xl border border-line bg-bg-card/50 p-5">
              <h2 className="text-[15px] font-semibold leading-snug text-ink">{p.k}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{p.v}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-7 text-[15px] leading-relaxed text-ink-muted">
          <Section title="Start with zero credentials">
            <p>
              The fastest way to try GridMind needs no cloud access at all: upload a billing CSV or enter a few numbers
              by hand, and you get a full cost &amp; savings picture in minutes. Signed out, that data lives in a private
              workspace scoped to your browser — it isn&apos;t shared, and it never lands in the public demo. Connecting a
              cloud is an upgrade you opt into later, not a precondition.
            </p>
          </Section>

          <Section title="Where your credentials live">
            <p>
              When you do connect a cloud, GridMind reads provider credentials from the environment of{" "}
              <b className="text-ink">your own deployment</b> — the same place you keep every other secret. They are read
              at request time to call the provider&apos;s billing API, and that&apos;s it: not written to our database, not
              sent to GridMind&apos;s servers, not printed to logs. There is no key-upload form because there is nowhere for
              a key to be stored. The least-trust way to run GridMind on real data is to self-host it, so the keys never
              leave infrastructure you control.
            </p>
          </Section>

          <Section title="Least privilege, per provider">
            <p>Each integration needs exactly one read-only billing scope:</p>
            <div className="mt-3 overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[560px] border-collapse text-[13.5px]">
                <thead>
                  <tr className="border-b border-line bg-bg-card/50 text-left">
                    <th className="px-4 py-2.5 font-semibold text-ink">Provider</th>
                    <th className="px-4 py-2.5 font-semibold text-ink">What you grant</th>
                    <th className="px-4 py-2.5 font-semibold text-ink">Scope / role</th>
                  </tr>
                </thead>
                <tbody>
                  {SCOPES.map((s) => (
                    <tr key={s.p} className="border-b border-line/60 last:border-0">
                      <td className="px-4 py-2.5 text-ink">{s.p}</td>
                      <td className="px-4 py-2.5 text-ink-muted">{s.grant}</td>
                      <td className="px-4 py-2.5 font-mono text-[12px] text-ink-muted">{s.scope}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[13px] text-ink-faint">
              None of these grant write, compute, or storage access. If a provider supports it, scope the role to a single
              billing account or subscription.
            </p>
          </Section>

          <Section title="What we actually store">
            <p>
              Only the <b className="text-ink">result</b> of reading your billing: normalized usage rows — cost, GPU-hours,
              region, and the like — in the database row for your workspace. Every query is scoped to your organization, so
              one workspace can never read another&apos;s data. The public, no-login demo always shows sample data and never
              accepts real spend, so nothing you connect can leak into it.
            </p>
          </Section>

          <Section title="Sign-in &amp; payments">
            <p>
              Sign-in uses Google or GitHub OAuth and shares only your name, email, and avatar — it grants GridMind no
              access to your cloud. Sessions are kept in a signed cookie. Payments, if you subscribe, are handled by Stripe:
              card details go straight to Stripe and GridMind never sees or stores a full card number.
            </p>
          </Section>

          <Section title="In transit &amp; control">
            <p>
              All traffic is served over HTTPS/TLS. You can revoke GridMind&apos;s access to a cloud at any time by removing
              the environment variable — no dashboard toggle to trust — and &ldquo;Reset to sample&rdquo; clears real data from a
              workspace instantly. To export or delete your data, email{" "}
              <a href="mailto:privacy@gridmind.ai" className="text-brand underline underline-offset-2 hover:brightness-110">privacy@gridmind.ai</a>.
            </p>
          </Section>

          <Section title="What we don't claim (yet)">
            <p>
              We&apos;d rather be straight with you than imply more than is true. GridMind is an early-stage product: we do
              <b className="text-ink"> not</b> yet hold a SOC 2 report or ISO 27001 certification, and we don&apos;t publish a
              formal uptime SLA. What we do offer is the architecture above — read-only, least-privilege, keys-in-your-own-environment —
              which limits the blast radius regardless of certification. If a formal attestation is a hard requirement for
              your team, tell us and we&apos;ll share our current roadmap and a self-hosting path.
            </p>
          </Section>

          <Section title="Responsible disclosure">
            <p>
              Found a vulnerability? Please email{" "}
              <a href="mailto:security@gridmind.ai" className="text-brand underline underline-offset-2 hover:brightness-110">security@gridmind.ai</a>{" "}
              with details and steps to reproduce. We&apos;ll acknowledge, investigate, and keep you posted — and we won&apos;t
              pursue action against good-faith research that avoids privacy violations and service disruption.
            </p>
          </Section>

          <p className="border-t border-line pt-6 text-xs text-ink-faint">
            See also our{" "}
            <Link href="/privacy" className="text-ink-muted underline underline-offset-2 hover:text-ink">Privacy Policy</Link>{" "}
            and{" "}
            <Link href="/terms" className="text-ink-muted underline underline-offset-2 hover:text-ink">Terms of Service</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
      {children}
    </section>
  );
}
