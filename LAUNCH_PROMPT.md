# GridMind — Launch, Pricing & Marketing Prompts

Three independent workstreams. Do them in order; confirm scope before the bigger ones.

---

## A. Make it launchable (required before charging money)

Today GridMind is an interactive demo on seeded, read-only data. To become a chargeable product:

1. **Auth** — gate the `(app)` routes (e.g. Auth.js): sign-up/sign-in, sessions, so CTAs ("Open the dashboard") are truthful. Keep a public, no-login demo workspace alongside it.
2. **Real data in** — provider API-key integrations and/or CSV import that populate the `usage`/`catalog` tables (the `lib/db.ts` already supports `meta.source='live'` to stop seeding over real data). Scope all spend/carbon/GridScore computations to the authenticated org, not the global seed.
3. **Persistence** — swap the on-disk/in-memory SQLite for a hosted DB (Postgres/Turso) behind the existing data layer; keep the seed as the local/dev default.
4. **Make "Route in one click" real or honest** — either implement actual placement actions against provider APIs, or relabel it as a *recommendation/plan* (not an executed action) until it does. Never imply it moves workloads if it doesn't.

Acceptance: a new user can sign up, connect or import their own data, and see their own numbers; the demo workspace still works with no login; `tsc`, `lint`, and the build pass.

---

## B. Pricing model (realistic but leaving money on the table)

Market context: real FinOps tools start ~$1,500/mo for ~$100K managed spend; mid-market platforms run ~$3–7k/mo; most price as a **% of cloud spend**, not flat tiers. GridMind's flat $99/$499/$1,999 ladder is competitive-to-cheap and internally consistent (the demo shows ~$8,820/mo saved on one node).

Change the pricing section to:

1. Keep **Startup $99** and **Growth $499** as flat self-serve entry tiers (good for PLG).
2. Convert **Business** and **Enterprise** to **value-based pricing**: a small % of managed/saved spend (e.g. "from $1,999/mo or 1–2% of optimized spend, whichever is greater"), since large accounts save far more than a flat fee captures.
3. Add an explicit ROI line near pricing: "Most teams save more in week one than a year of the plan" — and link it to the live worked example.
4. Add a free **"Read-only demo"** tier (what exists now) so the funnel is: demo → self-serve → value-based.

Keep the honest "illustrative figures / no sign-up" framing.

---

## C. Marketing & ads (honest-claims constrained)

Write launch assets, but obey these rules: do NOT present seeded/illustrative metrics ("27% average reduction", "$2.4B optimized") as real customer results; do NOT call it a live product while it's a demo; label modeled figures as modeled. Lead with the credible mechanism, not invented outcomes.

Produce:

1. A **waitlist / early-access landing variant** (or a banner on the current one): "Interactive demo live · early access opening" with an email capture, instead of implying paid signup.
2. **Ad copy** for LinkedIn + X + Google Search, 3 variants each, targeted at the three personas (ML platform lead, FinOps owner, AI-native founder). Angles that are true today:
   - "See the 8-provider H100 price spread for yourself — interactive demo, no sign-up."
   - "Score any cloud/region 0–100 on cost, carbon and latency."
   - "Model your AI compute savings in two minutes."
3. A **launch post** (Show HN / LinkedIn / Product Hunt blurb) framed as "I built an interactive model of cross-cloud AI compute routing" — honest about it being a demo/prototype.
4. A short **claims checklist** the team can use before any ad goes out (real vs modeled, live vs demo, no fabricated testimonials).

---

## Suggested order
A (launchability) → B (pricing) → C (marketing). C can run in parallel as a *waitlist* even before A is done, since a waitlist makes no product promises.
