import Link from "next/link";

export const metadata = {
  title: "Privacy Policy · GridMind",
  description: "How GridMind collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="app-backdrop min-h-screen">
      <div className="mx-auto max-w-3xl px-5 py-16 sm:py-20">
        <Link href="/" className="text-sm text-ink-faint transition-colors hover:text-ink-muted">← GridMind</Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-ink">Privacy Policy</h1>
        <p className="mt-2 text-sm text-ink-faint">Last updated June 21, 2026</p>

        <div className="mt-8 flex flex-col gap-7 text-[15px] leading-relaxed text-ink-muted">
          <p>
            GridMind (&ldquo;we,&rdquo; &ldquo;us&rdquo;) helps teams understand and optimize the cost of AI
            compute across clouds. This policy explains what we collect, why, and the choices you have. We
            collect as little as we can to run the product.
          </p>

          <Section title="What we collect">
            <ul className="ml-4 list-disc space-y-1.5">
              <li><b className="text-ink">Waitlist email</b> — if you join early access, the email address you submit.</li>
              <li><b className="text-ink">Account info</b> — if you sign in, the name, email, and avatar your identity provider (Google or GitHub) shares.</li>
              <li><b className="text-ink">Cloud cost &amp; usage data</b> — data you choose to connect (read-only cloud billing), upload (CSV), or enter by hand. We use it to compute your spend, savings, and GridScore. Signed out, it lives in a private guest workspace tied to a cookie in your browser — isolated from the public demo and from other visitors.</li>
              <li><b className="text-ink">Basic technical data</b> — a cookie to keep you signed in (or to hold your signed-out guest workspace), and standard server logs.</li>
            </ul>
          </Section>

          <Section title="What we never do">
            <ul className="ml-4 list-disc space-y-1.5">
              <li>We <b className="text-ink">do not sell</b> your data or share it for advertising.</li>
              <li>We <b className="text-ink">never store your cloud credentials.</b> Provider keys stay in your own environment; our access is read-only and used only to fetch billing/usage you authorize.</li>
              <li>We do not move, launch, or change any of your cloud workloads — GridMind produces recommendations, not actions.</li>
              <li>For the full picture — least-privilege scopes, where keys live, and what we store — see our <Link href="/security" className="text-ink underline underline-offset-2 hover:brightness-110">Security &amp; Trust</Link> page.</li>
            </ul>
          </Section>

          <Section title="How we use data">
            <p>
              To provide and improve the product: compute your cost analytics and recommendations, keep you
              signed in, respond to you, and (for waitlist emails) tell you when early access opens. We process
              data on the legal basis of providing the service you requested.
            </p>
          </Section>

          <Section title="Sub-processors">
            <p>
              We rely on a small set of vetted providers to run GridMind — hosting/CDN, a managed database, and
              your chosen sign-in provider (Google or GitHub). They process data only to provide infrastructure
              to us. We may also disclose data if required by law.
            </p>
          </Section>

          <Section title="Security &amp; retention">
            <p>
              Data is encrypted in transit (HTTPS/TLS), and cloud credentials never reach us — they stay in your own
              environment and our access is read-only (see{" "}
              <Link href="/security" className="text-brand underline underline-offset-2 hover:brightness-110">Security &amp; Trust</Link>{" "}
              for exactly how). We keep your data only as long as your account is active or as needed to provide the
              service; waitlist emails are kept until early access launches or you ask us to remove you. You can request
              access to, export of, or deletion of your data at any time.
            </p>
          </Section>

          <Section title="Your choices">
            <p>
              Email <a href="mailto:privacy@gridmind.ai" className="text-brand underline underline-offset-2 hover:brightness-110">privacy@gridmind.ai</a> to
              access, correct, or delete your data, or to unsubscribe from the waitlist. You can also disconnect a
              cloud integration or reset your workspace to sample data from the app at any time.
            </p>
          </Section>

          <Section title="Changes &amp; contact">
            <p>
              We&rsquo;ll update this page if our practices change and revise the date above. Questions?{" "}
              <a href="mailto:privacy@gridmind.ai" className="text-brand underline underline-offset-2 hover:brightness-110">privacy@gridmind.ai</a>.
            </p>
          </Section>

          <p className="border-t border-line pt-6 text-xs text-ink-faint">
            See also our <Link href="/security" className="text-ink-muted underline underline-offset-2 hover:text-ink">Security &amp; Trust</Link> page and{" "}
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
