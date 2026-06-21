# GridMind — Full Redesign Prompt (use ALL design skills)

You are redesigning the **GridMind** marketing/product site to be dramatically more polished, professional, and memorable — with cinematic, Noomo-Agency-style motion. Work in the existing codebase.

**Stack & key files**
- Next.js 15 App Router + Tailwind. Motion: GSAP, Framer Motion, Lenis. Data: seeded SQLite.
- Marketing: `app/(marketing)/page.tsx` → `components/Landing.tsx`. Supporting motion components in `components/` (HeroScene, AuroraCanvas, BentoFeatures, KineticStatement, MarqueeVelocity, ProcessScroll, TiltCard, SpotlightCard, BeamBorder, Cursor, ScrollProgress, Scramble, Parallax).
- App: `app/(app)/*` via `components/AppShell.tsx` + 7 product pages.
- Tokens: `tailwind.config.ts` + `app/globals.css`. Brand = "ship's chronometer" steel-blue (`#4f9dcb`) + patinated brass (`#cda253`) on near-black.

**Constraints (non-negotiable)**
- Evolve the steel-blue/brass identity — do not throw it away.
- Every motion effect must have a `prefers-reduced-motion` fallback and never leave content stuck hidden if JS fails.
- WCAG 2.1 AA: contrast ≥ 4.5:1 (text), focus-visible states, 44px touch targets, semantic landmarks, keyboard operability.
- `tsc --noEmit`, `next lint`, and the Tailwind build must all pass.

## Run the design skills in this order — each feeds the next

1. **design:user-research** — Since there is no live user data, write 2–3 proto-personas and their Jobs-To-Be-Done for GridMind (e.g. ML platform lead, FinOps owner, infra eng). Capture the questions each lands on the page with. Output: a short personas + JTBD brief.

2. **design:research-synthesis** — Synthesize those personas into 3–4 themes and a prioritized list of what the redesign must communicate and in what order (the page's narrative spine). Output: messaging hierarchy.

3. **design:design-critique** — Critique the CURRENT landing page (read `components/Landing.tsx` and run it mentally) against the critique framework: first impression, usability, visual hierarchy, consistency, accessibility. Output: a ranked list of concrete problems and opportunities.

4. **design:design-system** — Audit `tailwind.config.ts` + `app/globals.css` for token coverage and hardcoded values. Define/extend the token set (color, type scale, spacing, radius, elevation, motion) and a small component vocabulary (buttons, cards, eyebrow, section, pill). Replace ad-hoc values with tokens. Output: documented tokens + components.

5. **design:ux-copy** — Rewrite every headline, subhead, CTA, eyebrow, and microcopy to be sharp, benefit-led, and consistent in voice. Keep the honest "live demo / illustrative data — no sign-up" framing. Output: a copy deck mapped to each section.

6. **Implement** — Apply 3–5 using the messaging spine from 1–2. Build a cinematic landing experience: a layered hero with scroll-driven depart, a pinned horizontal "how it works" sequence, kinetic type, magnetic CTAs, spotlight/tilt cards, velocity marquee, film-grain + vignette depth. Reuse and elevate the existing motion components; add new ones only where they earn their place.

7. **design:accessibility-review** — Audit the finished redesign against WCAG 2.1 AA. Fix every Critical/Major finding. Verify reduced-motion, keyboard nav, focus order, contrast on the new gradient/glass surfaces. Output: an audit table with pass/fail.

8. **design:design-handoff** — Produce a short handoff spec for the new sections: layout, tokens used, component props, interaction/animation details, responsive breakpoints, and edge cases. Output: `DESIGN_HANDOFF.md`.

## Deliverables
- Updated `components/Landing.tsx` (+ any new section components) and refined `tailwind.config.ts` / `app/globals.css`.
- A `DESIGN.md` capturing personas/JTBD, messaging spine, token + component decisions, and the copy deck.
- `DESIGN_HANDOFF.md` (from step 8) and an accessibility audit table.
- All checks green: `npx tsc --noEmit`, `npx next lint`, and `npx tailwindcss -c ./tailwind.config.ts -i ./app/globals.css -o /tmp/tw.css` (compiles with no errors).

## Acceptance bar
- A first-time visitor understands "GridMind cuts AI compute cost via automated routing" within 2 seconds.
- The page feels premium and intentional: deliberate type scale, generous rhythm, layered depth, one signature easing.
- Motion is rich on capable devices and fully graceful under reduced-motion / no-JS.
- Zero hardcoded hex/spacing that should be a token; one primary + one ghost CTA used consistently.

Work section by section. After steps 1–5, summarize the plan before implementing. After implementation, run step 7–8 and report what passed and what remains.
