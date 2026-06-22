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

## Connecting customer clouds (cross-account)

GridMind can read **other** companies' cloud spend — each customer grants read-only access to their own account, so no keys change hands. We store only non-secret connection ids per workspace; each wizard on **/integrations** works but shows an honest "not configured yet" notice until you set GridMind's own identity for that provider.

### Amazon Web Services (cross-account role)

Each customer grants read-only access via a cross-account role. To enable it:

1. **Give GridMind an AWS identity.** The app needs to run as an IAM principal in *your* GridMind AWS account that is allowed to assume customer roles. Attach a policy like:
   ```json
   { "Effect": "Allow", "Action": "sts:AssumeRole", "Resource": "arn:aws:iam::*:role/GridMindCostReadOnly" }
   ```
   Make those credentials available through the standard AWS chain (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`, or your platform's instance/role identity).
2. **Set `GRIDMIND_AWS_ACCOUNT_ID`** to that account's 12-digit id. It's the principal each customer's role trusts — the connect wizard bakes it into the template it hands the customer.
3. Redeploy. On **/integrations → Connect your AWS account**, the customer clicks *Generate my setup*, deploys the one-role CloudFormation/Terraform in their account (granting only `ce:GetCostAndUsage`, trusting your account under a per-customer ExternalId), pastes the Role ARN back, and their spend loads.

GridMind stores only the **role ARN + ExternalId** per workspace — never a credential — and the customer revokes anytime by deleting the role.

### Google Cloud (service-account grant)

1. **Give GridMind a service account.** Set `GCP_SA_EMAIL` + `GCP_SA_PRIVATE_KEY` to a service account in *your* GCP project; its email is what customers grant access to.
2. The customer (on **Connect your Google Cloud account**) runs the generated `gcloud` commands to grant that service account `roles/bigquery.dataViewer` + `roles/bigquery.jobUser` on their billing-export project, then enters their **project id** + **billing-export table**. GridMind stores only **{project, table}** and reads their export with your service account's read-only token.

### Microsoft Azure (multi-tenant app)

1. **Register a multi-tenant Entra app.** In *your* tenant, register an app ("Accounts in any organizational directory"), add a client secret, and set `AZURE_CLIENT_ID` + `AZURE_CLIENT_SECRET`.
2. The customer (on **Connect your Azure subscription**) enters their **tenant id** + **subscription id**, opens the generated **admin-consent** link to consent to your app in their tenant, then runs the `az role assignment` command to grant it **Cost Management Reader** on the subscription. GridMind stores only **{tenantId, subscriptionId}** and reads their spend with a token minted in their tenant using your app creds.

Until each provider's GridMind-side identity is set, that wizard still works and saves the connection, but the pull no-ops (it syncs once you configure it).

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
| `AWS_*` / `AZURE_*` / `GCP_*` / `GRIDMIND_NEOCLOUD_FEEDS` | optional | Read-only cloud cost for a **self-hosted** deployment (your own clouds). The `GCP_SA_*` and `AZURE_CLIENT_*` creds double as GridMind's identity for customer GCP/Azure connect — see *Connecting customer clouds*. |
| `GRIDMIND_AWS_ACCOUNT_ID` | for customer AWS connect | Your GridMind AWS account id — the principal each customer's cross-account role trusts. Pair it with an AWS identity (the app's default credential chain) allowed to `sts:AssumeRole` those roles. See *Connecting customer clouds* above. |

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
