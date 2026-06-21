# GridMind — Landing Redesign Design Doc

A record of the design pipeline behind the marketing-site redesign: who it's for,
what it must say and in what order, the token/component system, and the copy deck.

---

## 1 · Proto-personas & Jobs-To-Be-Done

No live users exist (GridMind is a live **demo**), so these are evidence-based
proto-personas drawn from the FinOps / ML-platform domain.

| Persona | Context | Job-To-Be-Done | Questions they land with |
|---|---|---|---|
| **Maya — ML Platform Lead** | Series-B AI startup, owns infra for ~40 engineers | *"When my GPU bill jumps 30%, show me where it goes and cut it — without re-architecting or touching SLAs."* | Does it really cut cost? Performance impact? Adoption effort? My providers/GPUs? Is it safe? |
| **Devraj — FinOps owner** | Owns cloud + AI spend across teams | *"When finance asks why AI spend is up, give me per-team/model attribution and a forecast I can take to the CFO."* | Spend by team/model? Forecast & budget? Chargeback? Are the numbers credible? |
| **Sam — Founder / Evaluator** | Also the recruiter / investor lens | *"In seconds, let me grasp the product and judge whether this team understands AI economics — and let me poke it now."* | What is this? Real or vapor? Can I try it with no signup? Does it look premium? |

---

## 2 · Synthesis → Messaging Spine

**Themes**
- **A — Prove the savings, fast.** Every persona lands skeptical of a cost claim; credibility + "no performance loss" is job #1.
- **B — Show, don't tell.** The honest *live demo, no sign-up* is a trust asset — lead with it, don't bury it.
- **C — Mechanism in one breath.** "OS for AI compute" is evocative but abstract; it needs **Observe → Route → Deploy**.
- **D — Bill *and* boardroom.** Maya wants infra/SLAs; Devraj wants attribution/forecast. Surface both.

**Narrative spine (page order — the existing order already matches, so we sharpen, not restructure):**
1. **Hook** — *what + outcome* in 2 seconds, primary CTA to the demo.
2. **Proof of scale** — providers/regions/$ optimized (+ honesty caveat) + provider marquee.
3. **How it works** — Observe → Route → Deploy (pinned horizontal sequence).
4. **Platform breadth** — bento: routing, GridScore, simulator, budget/forecast, map, marketplace.
5. **Conviction** — kinetic manifesto.
6. **Honest pricing** — illustrative plans, demo CTA.
7. **Close** — committed CTA band → open the demo.

---

## 3 · Design Critique (current `components/Landing.tsx`)

**Overall:** Cinematically strong and on-brand (steel/brass, layered motion, custom hero network). The biggest wins are content-integrity, CTA consistency, and 2-second clarity.

| # | Severity | Finding | Fix |
|---|---|---|---|
| 1 | 🔴 Critical | Stat counters render `0` and only the GSAP count-up sets the value — `forceVisible()` and the reduced-motion branch never set it. So **reduced-motion + no-JS users see "0% / 0 / 0 / $0B"**. | Render the real value as the default text; animate *from 0* only when motion is on. |
| 2 | 🟡 Moderate | Same action labeled three ways ("View the demo" / "Explore the live demo" / "Open the live demo"); "Talk to sales" → `/dashboard`. | One primary verb everywhere: **"Open the live demo"**. |
| 3 | 🟡 Moderate | Poetic H1 doesn't state the outcome; value lives in the subhead. Hero "20%+" vs stats "27%". | H1 carries the word **cost**; reconcile to a single **27%**. |
| 4 | 🟡 Moderate | `ink-faint #6e7e8b` on `bg #0e1318` ≈ **4.43:1** — under 4.5 for 11–12px eyebrows/footnotes. | Bump `ink-faint` to ≥ 4.5:1. |
| 5 | 🟡 Moderate | Nav + pricing buttons bypass `.btn-*`; logo SVG duplicated with hardcoded `#4f9dcb`; decorative canvases not `aria-hidden`. | Route all CTAs through the button system; extract `<BrandMark/>`; `aria-hidden` the canvases. |
| 6 | 🟢 Minor | No mobile nav menu (links are `hidden md:flex`). | Acceptable — anchors reachable by scroll; CTA persists. Optional drawer later. |

**What works well:** cohesive identity; tokenized easings; reduced-motion + `forceVisible` safety net; honest demo framing; editorial stats band; the live hero network is a genuine "this team gets it" signal.

---

## 4 · Design System — tokens & component vocabulary

**Already solid:** `bg` (deep/DEFAULT/raised/card/hover), `line` (soft/DEFAULT/bright), `ink` (bright/DEFAULT/muted/faint), `brand`+`brass`+semantics, elevation `e1–e3`, easings `ek / ek-inout / drawer`, `card / pill / nav-item / eyebrow / hairline / section / btn-primary / btn-ghost / text-gradient(-brass) / grain / vignette / edge-fade`.

**Gaps fixed in this pass:**

| Category | Problem | Decision |
|---|---|---|
| Type scale | Headings use ad-hoc `clamp()` (4 different inline clamps) | Fluid scale utilities: `.display-1` (hero), `.display-2` (section H2), `.display-3` (stat), `.lead` (subhead) — encode each clamp once. |
| Spacing rhythm | Section vertical padding ad-hoc (`py-24 / pb-28 / py-40`) | `.section-y` = one fluid vertical rhythm (`clamp`), used on every band. |
| Color tokens | `#6fb6e0` (gradient top / hover) and logo `#4f9dcb` hardcoded | Add `brand.bright #6fb6e0`; `<BrandMark/>` uses `currentColor`. |
| Contrast | `ink-faint` fails AA for small text | `ink-faint` → `#7e8b98` (≈ 5.3:1 on `bg`). |
| Buttons | No `sm` size; not 44px-floored; bypassed by nav/pricing | Add `.btn-sm`; `min-height: 44px` on `.btn-primary/.btn-ghost`; route every CTA through them. |

**Component vocabulary (documented):**
- **Button** — variants `primary` / `ghost`, size `default` / `sm`; states default/hover/active/focus-visible/disabled; 44px min target; always a verb label.
- **Card** — `.card` surface + optional `.lift` (pointer-gated hover).
- **Eyebrow** — `.eyebrow` (mono, 0.22em tracking, `ink-faint`) — decorative section label.
- **Pill** — `.pill` status/metadata chip.
- **Section** — `.section` (max-width + gutter) + `.section-y` (vertical rhythm).
- **Hairline** — `.hairline` gradient rule.
- **BrandMark** — `<BrandMark size>` the GridMind glyph, `currentColor`.
- **GradientText** — `.text-gradient` / `.text-gradient-brass`, used only on key words.

---

## 5 · Copy Deck

**Voice:** confident, precise, instrument-grade. No hype verbs. Lead with the outcome. Keep the honest demo framing. **Primary CTA = "Open the live demo →"** everywhere; **ghost = "See it route"**.

| Section | Element | Copy |
|---|---|---|
| Nav | CTA | **Open live demo →** |
| Hero | Status pill | Live across 8 clouds · 13 regions |
| Hero | H1 | The operating system for **AI compute cost.** |
| Hero | Subhead | GridMind routes every workload to the cheapest, fastest, greenest place it can run — then deploys the change in one click. Teams cut spend **~27%** with zero performance loss. |
| Hero | Primary CTA | Open the live demo → |
| Hero | Ghost CTA | See it route |
| Hero | Trust row | No sign-up · Live demo data · Read-only & safe |
| Stats | Eyebrow | By the numbers |
| Stats | Values | **27%** avg cost reduction · **8** clouds & GPU providers · **13** global regions · **$2.4B** compute optimized |
| Stats | Caveat | Illustrative figures from a seeded demo dataset — not live customer data. |
| How it works | Step 1 — Observe | Unify every provider. One view for spend, utilization, carbon and GridScore across all 8 clouds. |
| How it works | Step 2 — Route | Find the optimal home. The engine scores every region and GPU on cost, speed and carbon, then picks the best for each workload. |
| How it works | Step 3 — Deploy | Apply in one click. Reserve capacity, drain old regions and reroute traffic — automatically, with no performance hit. |
| Platform | Eyebrow / H2 | The platform / Everything you need to **run AI compute like a business.** |
| Pricing | H2 | Pricing that **pays for itself.** |
| Pricing | Sub | Illustrative plans for the modeled product. The full platform is open now on the live demo — no sign-up required. |
| Pricing | CTAs | Open the live demo (Startup/Growth/Business) · **Talk to sales** → `mailto:` (Enterprise) |
| Final CTA | Eyebrow / H2 | Start now / Stop overpaying for **AI compute.** |
| Final CTA | Sub | See the spend, the GridScore and the savings model in under two minutes. No sign-up — it's a live demo. |
| Final CTA | CTA | Open the live demo → |

---

*Implementation, accessibility audit, and handoff spec follow in `DESIGN_HANDOFF.md`.*
