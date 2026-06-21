# GridMind Landing — Accessibility Audit & Developer Handoff

Scope: `components/Landing.tsx` and its sections + the token layer in
`tailwind.config.ts` / `app/globals.css`. Stack: Next.js 15 (App Router),
Tailwind v3, GSAP + Framer Motion + Lenis.

---

## A · Accessibility Audit — WCAG 2.1 AA

**Standard:** WCAG 2.1 AA · **Result:** 0 Critical / 0 Major open (both pre-existing issues fixed in this pass) · 2 Minor (accepted).

### Findings

**Perceivable**
| # | Issue | Criterion | Severity | Status |
|---|---|---|---|---|
| 1 | `ink-faint #6e7e8b` on `bg` = **4.46:1** — fails for 11–12px eyebrows/footnotes | 1.4.3 Contrast | 🔴 Critical | **Fixed** → `#7e8b98` = 5.36:1 |
| 2 | Decorative canvases (Aurora, HeroScene), grid/scrim/vignette, hero-node tooltip exposed to AT | 1.1.1 / 4.1.2 | 🟡 Major | **Fixed** → wrapped in `aria-hidden`; `<BrandMark aria-hidden>` paired with the "GridMind" text label |

**Operable**
| # | Issue | Criterion | Severity | Status |
|---|---|---|---|---|
| 3 | CTA tap targets under 44px | 2.5.5 Target Size | 🟡 Major | **Fixed** → `.btn` `min-height:44px` on every CTA |
| 4 | Focus visibility on new glass/gradient surfaces | 2.4.7 | — | **Pass** — global `:focus-visible` 2px brand outline (≥3:1) |
| 5 | Keyboard operability | 2.1.1 / 2.4.3 | — | **Pass** — all interactives are `<a>`/`<button>`; DOM order = visual order; skip-link + `<main id="main">` in the marketing layout |

**Understandable**
| # | Issue | Criterion | Severity | Status |
|---|---|---|---|---|
| 6 | Custom cursor / focus changes context unexpectedly | 3.2.1 | — | **Pass** — cursor hides native only on `mousemove`, never on focus; no context shifts |

**Robust**
| # | Issue | Criterion | Severity | Status |
|---|---|---|---|---|
| 7 | Landmark naming | 4.1.2 | — | **Pass** — `<nav aria-label="Primary">` + footer `<nav aria-label="Platform|Tools|Explore">` |

**Content integrity (constraint: never stuck/wrong if JS fails)**
| # | Issue | Severity | Status |
|---|---|---|---|
| 8 | Stat counters rendered `0`; only GSAP set the value, so **reduced-motion + no-JS showed "0% / 0 / 0 / $0B"** | 🔴 Critical | **Fixed** — real value is the default DOM text (`fmtStatNumber`); count-up animates *from 0* only when motion is on. Verified in no-JS HTML: `27 / 8 / 13 / 2.4`. |

### Color Contrast Check (computed, sRGB WCAG formula)
| Foreground | Background | Ratio | Req. | Pass |
|---|---|---|---|---|
| `ink-bright #f6f9fc` | `bg #0e1318` | 17.67:1 | 4.5 | ✅ |
| `ink #e9eef3` | `bg` | 15.99:1 | 4.5 | ✅ |
| `ink-muted #a3b2bf` | `bg` | 8.60:1 | 4.5 | ✅ |
| `ink-faint #7e8b98` (new) | `bg` | **5.36:1** | 4.5 | ✅ |
| `ink-faint` | `bg-card #18212a` | 4.68:1 | 4.5 | ✅ |
| `ink-faint` | `bg-deep #080b0f` (footer) | 5.66:1 | 4.5 | ✅ |
| `brand #4f9dcb` | `bg` | 6.24:1 | 4.5 | ✅ |
| `brass #cda253` | `bg` | 7.90:1 | 4.5 | ✅ |
| Button label `bg` on `brand` | — | 6.24:1 | 4.5 | ✅ |

### Reduced motion / no-JS
- `prefers-reduced-motion`: Landing early-returns to static hero + `forceVisible()`; `ProcessScroll` swaps the pinned track for a vertical stack; Bento/Process use `<MotionConfig reducedMotion="user">`; global CSS neutralizes durations. **Stats show real numbers.**
- No-JS: all content is server-rendered and visible; nothing depends on JS to be readable.

### Minor (accepted)
- Skip-link target `#main` includes the short primary nav (convention; acceptable for a 4-link bar).
- No mobile hamburger menu — nav anchors are reachable by scroll and the primary CTA persists at all widths.

---

## B · Developer Handoff Spec

### Layout
- Container: `.section` = `max-width:1280px` + `px-6` gutter.
- Vertical rhythm: `.section-y` = `padding-block: clamp(5rem, 10vw, 8.5rem)` on every band (replaces ad-hoc `py-24/28/40`).
- Hero grid: `lg:grid-cols-[1.05fr_minmax(0,420px)]` (copy left, HeroPanel right); single column < `lg`.

### Design Tokens
| Token | Value | Usage |
|---|---|---|
| `bg.deep / DEFAULT / raised / card / hover` | `#080b0f / #0e1318 / #141b22 / #18212a / #1f2a34` | Letterboxing/footer · page · raised · cards · hover |
| `line / line-soft / line-bright` | `#273440 / #1b252e / #3a4d5c` | Borders, dividers |
| `ink.bright / DEFAULT / muted / faint` | `#f6f9fc / #e9eef3 / #a3b2bf / #7e8b98` | Headlines · body · secondary · captions (faint bumped for AA) |
| `brand.DEFAULT / dim / bright` | `#4f9dcb / #2c6a8e / #6fb6e0` | Primary instrument mark · dim · hover & gradient top |
| `brass` | `#cda253` | Single warm accent — value / "optimal" moments only |
| `display-1 / -2 / -3` | `clamp(2.8,6.5vw,5.6) / (2,4.5vw,3.4) / (2.4,5vw,3.6)rem`, weight 800 | Hero & final CTA / section H2 / stats & metrics |
| `lead` | `clamp(1.05,1.3vw,1.2)rem`, lh 1.6 | Subheads |
| Elevation `e1 / e2 / e3`, `glow`, `glow-brass` | see config | Card depth, focal glows |
| Easing `ek / ek-inout / drawer` | `cubic-bezier(0.23,1,0.32,1)` … | Signature `ek` for all reveals |
| Radius | `lg / xl / 2xl / full` | Buttons-sm / buttons & cards / panels / pills |

### Components
| Component | Variants | Compose as | Notes |
|---|---|---|---|
| **Button** | `primary`, `ghost`, size `sm` | `btn btn-primary` · `btn btn-ghost` · `+ btn-sm` | Base `.btn` = layout + `min-height:44px` + active scale 0.97; 44px AA target; always a verb. |
| **Section** | — | `section section-y` | Width + gutter + vertical rhythm. |
| **Eyebrow** | `text-brand` / `text-brass` tint | `.eyebrow` | Mono, 0.22em tracking, `ink-faint`. |
| **Pill** | — | `.pill` | Status/metadata chip. |
| **Hairline** | — | `.hairline` | Gradient rule. |
| **Card** | + `.lift` | `.card` | Pointer-gated hover lift (≤300ms). |
| **BrandMark** | `size`, `className` | `<BrandMark size={18}/>` | `currentColor`; `aria-hidden`; pair with text label. |
| **GradientText** | steel / brass | `.text-gradient` / `.text-gradient-brass` | Key words only. |

### States & Interactions
| Element | State | Behavior |
|---|---|---|
| `.btn-primary` | hover / active / focus | `brightness-110` / `scale(0.97)` 140ms `ek` / brand outline |
| `.btn-ghost` | hover | `border-line-bright` + `bg-card/70` |
| `[data-magnetic]` (CTAs) | pointer move | magnetic pull (`gsap.quickTo` ×0.4), springs back on leave; **no-op under reduced-motion** |
| Nav | scroll > 40px | border + `bg/70` + `backdrop-blur-xl` fade-in (300ms) |
| Hero node | hover | live region preview card at cursor (`aria-hidden`) |

### Responsive
| Breakpoint | Changes |
|---|---|
| ≥ 1024px (`lg`) | Two-col hero; pinned horizontal ProcessScroll; full nav links |
| 768–1024 (`md`) | Single-col hero; ProcessScroll → vertical stack; 4-col stats |
| < 768px (`sm`) | Stats 2-col; pricing 1-col; nav links hidden (logo + CTA persist) |

### Motion
| Element | Trigger | Animation | Duration | Easing |
|---|---|---|---|---|
| Hero lines | load | mask-up `yPercent 118→0` + deblur | 1.3s | `ek` |
| Hero fades | load | `opacity/y` stagger 0.09 | 1.0s | `ek` |
| Hero band | scroll | parallax depart `yPercent -14`, fade to 0.35 | scrub 0.6 | none |
| `[data-reveal]` | in-view (top 88%) | `y 46→0` + fade | 0.9s | `ek` |
| Stat numbers | in-view (top 90%) | count-up 0 → value | 1.8s | `power2.out` |
| Marquee | scroll velocity | speed + skew | — | — |
| ProcessScroll | scroll (pinned) | horizontal `x` track + progress rail | scrub | linear |

### Edge cases
- **Motion fails / no-JS:** `forceVisible()` un-hides all animated nodes; stats show real values; content fully legible.
- **Long copy:** headings use `[text-wrap:balance]`; subhead `max-w-xl`; cards flex to content.
- **Enterprise CTA:** `mailto:hello@gridmind.ai` (the only non-demo action); all other CTAs → `/dashboard` (the live demo).
- **Numbers are illustrative:** seeded demo dataset — disclaimed in the stats band and footer.
