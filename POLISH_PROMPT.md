# GridMind — Landing Polish Prompt

Polish the current light-palette landing page (`components/Landing.tsx`, `components/Scene3D.tsx`). The art direction and motion are good — these are surgical legibility, consistency, and clarity fixes. Keep the light lavender palette, the gold floating object, and the heavy-inertia/parallax scroll. Don't regress reduced-motion or the no-JS fallback.

## Fix, in priority order

1. **Stop the gold object from colliding with text.** On the final "See your own numbers in two minutes" section the sphere sits on top of the headline + body copy; it also crowds the hero. Make the object NEVER overlap readable copy:
   - Keep it strictly behind text (`z-index`/layer) AND out of the text column — clamp its size/X-position when a `.panel`'s text stage is centered, or offset the object to empty gutters per section.
   - Add a subtle radial scrim behind giant type so any overlap still passes contrast.
   - Verify on the hero, the "two minutes" CTA, and the region sections.

2. **Region photo sections: raise contrast.** On Montréal/São Paulo etc., the small mono stat labels (electricity / grid carbon / GridScore) are too faint over the photo. Put the stat row on a solid or blurred card, or add a stronger left-to-dark gradient scrim behind the text block. Target WCAG AA (≥4.5:1 for the labels and values).

3. **Commit to one display voice.** The page mixes a serif ("Same node, two bills", "Every month you wait") with a heavy grotesque (hero, "See your own numbers"). Pick a deliberate rule — e.g. grotesque for product/benefit headlines, serif only for the editorial "chapter" moments — and apply it consistently. Document the rule in a comment.

4. **Tighten the object's form language.** Some frames read as soft amorphous blobs/eggs. Make the geometry consistent and intentional (a coherent faceted or rounded form), so it feels designed rather than random.

5. **Orient first-time visitors faster.**
   - Surface "who it's for" higher (a one-line audience strip near the top, before the deep AUDIENCE section).
   - Define GridScore in one line at first use ("a 0–100 rating of any placement on cost, carbon, latency and reliability").

## Acceptance
- The gold object never overlaps body text or headlines anywhere; all copy passes AA contrast (check hero, "two minutes" CTA, region photos).
- One documented typographic rule, applied consistently.
- `npx tsc --noEmit`, `npx next lint`, and `npx tailwindcss -c ./tailwind.config.ts -i ./app/globals.css -o /tmp/tw.css` all pass.
- Reduced-motion and sub-1024px still render a clean static layout.

---

# Optional: close the demo → product gap

Today the site is an interactive demo on seeded, read-only data — no real integrations, auth, or persistence. To make the "how it's used" story real, scope and build:

1. **Auth** gating the `(app)` routes (e.g. Auth.js), so CTAs are truthful.
2. **Data in** — a CSV/JSON import matching the `usage` schema in `lib/db.ts`, and/or provider API-key integrations (the `lib/catalog.ts` comment already anticipates this) that populate `usage`/`catalog`.
3. **Scope** all cost/carbon/GridScore computations to the authenticated user's data instead of the global seed.
4. **Hosted DB** — swap the on-disk SQLite for a hosted DB behind the existing data layer (keep the seed as the local/dev default).

Do the polish section first; treat the product-gap section as a separate, larger effort and confirm scope before starting it.
