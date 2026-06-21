# GridMind — Implementation Prompt

You are working in the GridMind codebase: a Next.js 15 (App Router) app with a marketing landing page in `app/(marketing)` and a product app in `app/(app)`. Styling is Tailwind; motion uses GSAP, Framer Motion, and Lenis. Data comes from a seeded SQLite DB (`better-sqlite3`, `lib/db.ts` + `lib/seed.ts`). Pages use `export const dynamic = "force-dynamic"`. There is currently no auth and no public/ directory.

Make the changes below. Keep the existing dark "terminal" design language, the design tokens (ink/brand/brass, `tnum`), and the existing reduced-motion handling intact. Don't introduce new heavy dependencies unless required.

## Tier 1 — Quick wins (do these first)

1. **SEO + social metadata.** In `app/layout.tsx`, expand the `metadata` export: add `metadataBase`, an `openGraph` block (title, description, url, siteName, type, image), a `twitter` block (`summary_large_image`), and `icons`. Generate or add a 1200×630 OG image (a static `public/og.png` or a Next `opengraph-image` route) consistent with the brand.
2. **Favicon / icons.** Add `app/icon.svg` (reuse the existing GridMind logo mark used in `Landing.tsx`/`AppShell.tsx`) and an `apple-icon`. Create the `public/` directory if needed.
3. **Skip-to-content link.** Add a visually-hidden "Skip to main content" link as the first focusable element (in both the marketing layout and the app shell), targeting the main content region. Add matching `id`/`tabIndex` on the `<main>`.
4. **robots + sitemap.** Add `app/robots.ts` and `app/sitemap.ts` covering the public routes.

## Tier 2 — Accessibility & UX

5. **Custom-cursor fallback.** In `components/Cursor.tsx` and the `.has-custom-cursor` rule in `app/globals.css`, ensure the native cursor is never permanently hidden: only hide it once the custom cursor has mounted and is tracking, restore it on `blur`/tab-hidden and on any JS error, and respect `prefers-reduced-motion` (no custom cursor when reduced). Never leave a mouse user without a visible pointer.
6. **Animation guardrails.** Audit the landing page so that if GSAP/Lenis fail to initialize, content is still fully visible (no permanently hidden `opacity:0` elements). Confirm `prefers-reduced-motion` shows all content statically.
7. **Marketing-page honesty.** The landing stats ("27% average cost reduction", "$2.4B compute optimized", "Live across 8 clouds · 13 regions") are seeded demo values. Either (a) add a subtle "Illustrative data" disclaimer near the stats and footer, or (b) wire them to real values. Match the app shell, which already labels itself "Demo dataset."

## Tier 3 — Production readiness (larger; confirm scope before doing all)

8. **Deployability.** `better-sqlite3` + on-disk writes in `lib/db.ts` won't run on serverless/edge. Abstract the data layer behind an interface so the SQLite seed can be swapped for a hosted DB (e.g. Postgres/Turso). Keep the seeded dataset as the local/dev default.
9. **Auth.** Currently every CTA ("Launch app", "Start free", "no credit card") links straight to `/dashboard`. Add real auth (e.g. Auth.js) gating the `(app)` routes, with sign-in/sign-up, so the CTAs are truthful. If out of scope, at minimum relabel CTAs to "View the demo".
10. **User data input (the dashboard is demo-only today).** Add a way for users to bring their own data:
    - A CSV/JSON import for usage records (matching the `usage` table schema in `lib/db.ts`), with validation and a mapping step, **and/or**
    - Provider integrations (API keys per provider in a Settings page) that populate the `catalog`/`usage` tables — the `lib/catalog.ts` comment already anticipates this.
    - Scope cost/carbon/GridScore computations to the authenticated user's data instead of the global seed.

## Acceptance checklist
- `npm run build` and `npm run lint` pass.
- Lighthouse: no "links have discernible name" / contrast / hidden-content regressions; SEO section shows title, description, OG, canonical.
- Sharing the URL renders a proper card (OG image + title + description).
- Mouse users always see a cursor; keyboard users get a working skip link and visible focus.
- With JS disabled or motion reduced, all landing content is readable.
- (If Tier 3 done) a user can sign in, import or connect their own data, and see the dashboard reflect it.

Work tier by tier. After Tier 1 and Tier 2, summarize what changed and what remains before starting Tier 3.
