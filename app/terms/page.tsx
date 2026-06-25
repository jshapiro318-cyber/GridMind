import Link from "next/link";

export const metadata = {
  title: "Terms of Service · GridMind",
  description: "The terms that govern your use of GridMind.",
};

export default function TermsPage() {
  return (
    <div className="app-backdrop min-h-screen">
      <div className="mx-auto max-w-3xl px-5 py-16 sm:py-20">
        <Link href="/" className="text-sm text-ink-faint transition-colors hover:text-ink-muted">← GridMind</Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-ink">Terms of Service</h1>
        <p className="mt-2 text-sm text-ink-faint">Last updated June 21, 2026</p>

        <div className="mt-8 flex flex-col gap-7 text-[15px] leading-relaxed text-ink-muted">
          <p>
            These terms govern your use of GridMind. By using the product you agree to them. If you&rsquo;re using
            GridMind for an organization, you agree on its behalf.
          </p>

          <Section title="The service">
            <p>
              GridMind analyzes AI-compute cost, carbon, and placement across clouds and produces{" "}
              <b className="text-ink">recommendations</b>. It is advisory only: GridMind does not launch, stop,
              move, or otherwise change your cloud workloads, and connecting a cloud account grants read-only
              access to billing/usage you authorize.
            </p>
          </Section>

          <Section title="Early access &amp; illustrative figures">
            <p>
              GridMind is in early access. Features may change, break, or be removed. On the public demo and
              before you connect your own data, figures are <b className="text-ink">modeled and illustrative</b> —
              they are estimates, not guarantees of savings or outcomes. Nothing here is financial advice.
            </p>
          </Section>

          <Section title="Your account &amp; data">
            <p>
              You&rsquo;re responsible for activity under your account and for the credentials in your own
              environment. <b className="text-ink">You own your data.</b> You grant us a limited license to
              process it solely to provide the service to you. See the{" "}
              <Link href="/privacy" className="text-brand underline underline-offset-2 hover:brightness-110">Privacy Policy</Link>.
            </p>
          </Section>

          <Section title="Acceptable use">
            <p>
              Don&rsquo;t misuse the service: no attempts to break, overload, scrape at scale, reverse-engineer,
              or access data that isn&rsquo;t yours, and no unlawful use. We may suspend accounts that do.
            </p>
          </Section>

          <Section title="No warranty &amp; limitation of liability">
            <p>
              The service is provided &ldquo;as is,&rdquo; without warranties of any kind. To the maximum extent
              permitted by law, GridMind is not liable for indirect or consequential damages, or for decisions
              made based on modeled estimates. Our total liability is limited to the amount you paid us in the
              prior three months (or, for free use, US$100).
            </p>
          </Section>

          <Section title="Termination &amp; changes">
            <p>
              You may stop using GridMind at any time. We may update these terms; material changes will be
              reflected in the date above and, where appropriate, announced. Continued use means you accept the
              updated terms.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions about these terms?{" "}
              <a href="mailto:hello@gridmindhq.com" className="text-brand underline underline-offset-2 hover:brightness-110">hello@gridmindhq.com</a>.
            </p>
          </Section>

          <p className="border-t border-line pt-6 text-xs text-ink-faint">
            See also our <Link href="/privacy" className="text-ink-muted underline underline-offset-2 hover:text-ink">Privacy Policy</Link>.
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
