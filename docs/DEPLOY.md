# Deploying GridMind

GridMind is a standard Next.js 15 app and deploys to **Vercel** with a **Turso** (libSQL) database. Local dev needs nothing — it runs on a seeded file DB. Going live takes ~15 minutes and these accounts: **Vercel**, **Turso**, and **Google + GitHub** (for sign-in).

> The data layer is env-switched: with no `TURSO_*` set it uses a local file DB (`data/app.db`); set `TURSO_DATABASE_URL` and the same code talks to Turso. No code changes to deploy.

## 1. Provision the database (Turso)

```bash
# install the CLI: https://docs.turso.tech/cli/installation
turso db create gridmind
turso db show gridmind --url            # → TURSO_DATABASE_URL
turso db tokens create gridmind         # → TURSO_AUTH_TOKEN
```
The schema and demo seed are created automatically on first boot — no migration step.

## 2. Create the OAuth apps

- **GitHub** → Settings → Developer settings → OAuth Apps → New.
  Callback URL: `https://YOUR_DOMAIN/api/auth/callback/github`
- **Google** → Cloud Console → APIs & Services → Credentials → OAuth client (Web).
  Redirect URI: `https://YOUR_DOMAIN/api/auth/callback/google`

Copy each Client ID/Secret for the env vars below.

## 3. Generate the auth secret

```bash
openssl rand -base64 32        # → AUTH_SECRET
```

## 4. Deploy to Vercel

1. Push this repo to GitHub (or use `vercel` CLI).
2. In Vercel → **New Project** → import the repo (framework auto-detects as Next.js).
3. Add the environment variables (Settings → Environment Variables) from the table below.
4. **Deploy.** No build/output overrides are needed.

## 5. After deploy

- Set your custom domain in Vercel, then update the OAuth callback URLs + `NEXT_PUBLIC_SITE_URL` + `AUTH_URL` to match.
- Verify health: `curl https://YOUR_DOMAIN/api/health` → `{"status":"ok","db":"ok"}`.
- The public demo works with no login; sign-in + per-org data activate once the OAuth + Turso vars are set.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `AUTH_SECRET` | **yes** | Signs sessions. Without it, sessions don't persist across instances. |
| `AUTH_URL` | prod | Canonical URL, e.g. `https://gridmind.ai`. |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | for Google sign-in | OAuth client. |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | for GitHub sign-in | OAuth client. |
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | **yes (prod)** | Hosted database. Omit locally to use the seeded file DB. |
| `NEXT_PUBLIC_SITE_URL` | recommended | Used for SEO/OG metadata. |
| `SENTRY_DSN` | optional | Turns on error reporting (also `npm i @sentry/nextjs`). |
| `STRIPE_SECRET_KEY` | for billing | Enables self-serve subscriptions (Startup/Growth). |
| `STRIPE_WEBHOOK_SECRET` | for billing | Verifies the Stripe webhook at `/api/stripe/webhook`. |
| `STRIPE_PRICE_STARTUP` / `STRIPE_PRICE_GROWTH` | for billing | Stripe Price ids backing the two self-serve plans. |
| `AWS_*` / `AZURE_*` / `GCP_*` / `GRIDMIND_NEOCLOUD_FEEDS` | optional | Read-only cloud cost integrations (see `.env.example`). |

## Verify before shipping

```bash
npm run lint && npm test && npm run build
```
All three must pass (they do today).

## Billing (Stripe) — enables charging for the paid tiers

1. In Stripe, create two recurring **Prices**: Startup ($99/mo) and Growth ($499/mo). Copy each `price_…` id.
2. Set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_STARTUP`, `STRIPE_PRICE_GROWTH` in the env.
3. Add a webhook endpoint → `https://YOUR_DOMAIN/api/stripe/webhook`, subscribed to `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`. Copy its signing secret → `STRIPE_WEBHOOK_SECRET`.
4. Redeploy. Signed-in users subscribe from **/billing**; cancels/upgrades go through the Stripe customer portal.

Test the webhook locally with the Stripe CLI:
```bash
stripe listen --forward-to localhost:3300/api/stripe/webhook
```

## Still not wired
A waitlist follow-up **email** provider (e.g. Resend/Postmark) — the waitlist captures addresses but doesn't send mail yet.
