# GridMind

**The operating system for AI compute cost.** GridMind models where AI workloads run cheapest across 8 cloud providers and 13 regions, scores every placement 0–100 on cost, carbon, latency, and reliability (GridScore™), and turns the result into a routing plan you can act on.

> ⚠️ **Early access / prototype.** The dashboard runs on a seeded sample fleet by default — those figures are **modeled and illustrative**, not customer results. Connect read-only cloud billing or upload a CSV to see your own numbers. Routing is **recommendation-only**: GridMind never moves workloads or touches your cloud account.

## Features

- **Executive command center** — spend, potential savings, forecast, anomalies, and GridScore at a glance.
- **AI Routing Center** — four objectives (cost / speed / carbon / balanced), each producing a distinct, optimal placement plan.
- **GridScore™** — a 0–100 score per provider × region across cost, carbon, latency, and reliability.
- **Your data, read-only** — AWS / Azure / GCP / neocloud cost integrations and CSV import, scoped per organization.
- **Multi-tenant** — Auth.js sign-in (Google / GitHub) over a libSQL/Turso data layer; the public demo stays no-login.
- **Billing** — self-serve Stripe subscriptions for the paid tiers.

## Tech stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · libSQL/Turso · Auth.js (NextAuth v5) · Stripe · Vitest. Deploys on Vercel.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3300 — runs on a seeded sample fleet, zero setup
```

## Test, lint & build

```bash
npm test           # Vitest — routing engine, GridScore, CSV parser
npm run lint
npm run build
```

## Deploy

See **[docs/DEPLOY.md](docs/DEPLOY.md)** — Vercel + Turso + OAuth + Stripe, ~15 minutes. The app is env-gated: with no credentials it runs the public demo; add env to enable sign-in, real data, and billing.

## Security

Per-tenant data isolation, rate-limited public actions, a strict security-header/CSP baseline, parameterized SQL, and a `/api/health` probe. Cloud credentials are never stored — provider access is read-only.

## Honest status

GridMind is a working prototype. Demo figures are **modeled**. "Route in one click" produces a migration **plan** you apply yourself; it does not execute changes against your cloud.
