# GridMind — Launch Marketing Assets

> **Status today:** GridMind is an **interactive demo / prototype** running on a **seeded sample fleet** plus optional read-only connections to your own cloud billing. It is **not yet a paid, live product.** Every asset below is written to that truth.

## Honesty guardrails (read before publishing anything)

These are non-negotiable for every ad, post, and page:

1. **Never present modeled/seeded numbers as real customer results.** Figures like "27% reduction", "$144K saved", "$2.4B optimized" come from the model and the sample fleet — they are **illustrative**, not outcomes any customer achieved. If a number appears, the word **"modeled"** (or "illustrative" / "in the demo") must be near it.
2. **Don't call it a live product.** It's an "interactive demo," a "working prototype," or "early access." Not "the leading platform," not "trusted by teams."
3. **No fabricated social proof.** No invented testimonials, logos, customer counts, "join 500 teams," ratings, or awards.
4. **Lead with the mechanism, not invented outcomes.** What's true and verifiable *today*: the 8-provider price spread, GridScore (0–100 on cost/carbon/latency/reliability), the routing engine, the savings *model*. Sell that.
5. **CTAs match reality.** "Explore the demo (no sign-up)" and "Join the early-access waitlist" — never "Start your free trial" or "Buy now" (billing isn't live).

---

## 1) Waitlist / early-access banner (implemented on the landing)

**Eyebrow:** `Interactive demo live · early access opening`
**Headline:** See your own numbers in two minutes.
**Sub:** Explore the live demo now — no sign-up. Want your own spend in? Join the early-access list.
**Field + button:** `you@company.com` → **Join the waitlist**
**Microcopy:** No spam — one email when early access opens.
**Secondary:** Or open the interactive demo →

Alternate one-liners (A/B):
- "The interactive demo is live. Early access to connect your own data is opening — get in line."
- "Play with the model now. Be first to point it at your real bill."

---

## 2) Ad copy — 3 channels × 3 personas

Personas: **ML platform lead** (where workloads run), **FinOps owner** (spend visibility & control), **AI-native founder** (runway & overpaying).
All CTAs are demo/waitlist — never paid-signup.

### LinkedIn (single-image / text)

**› ML platform lead**
The same H100 can cost **$1.92–$3.45/hr** depending on which of 8 clouds and 13 regions it lands in — that spread is real and public. GridMind scores every provider×region 0–100 on cost, carbon, latency and reliability, then shows the optimal placement for each GPU. It's an interactive demo — explore the routing model, no sign-up.
**CTA:** See the H100 price spread →

**› FinOps owner**
Most AI-compute bills have no per-team, per-model, per-region breakdown — so waste hides. GridMind is an interactive model of cross-cloud spend: forecasts, anomaly flags, and a *modeled* savings estimate from re-routing. Connect read-only billing or just explore the sample fleet. No sign-up to look.
**CTA:** Model your savings →

**› AI-native founder**
If you're training and serving on a default hyperscaler, you're likely overpaying for the exact same silicon. GridMind models where each workload is cheapest across 8 providers and shows the runway that buys back — in the demo, on a sample fleet, in ~2 minutes. Early access to plug in your own data is opening.
**CTA:** Try the demo · join early access →

### X / Twitter (≤280 chars)

**› ML platform lead**
The same H100 ranges ~$1.92–$3.45/hr across 8 clouds. We built an interactive model that scores every cloud + region 0–100 on cost, carbon & latency and routes each GPU to its best home. Demo's live, no sign-up 👇

**› FinOps owner**
Where your AI workload runs decides what it costs. Interactive demo: see cross-cloud spend, anomalies, and a *modeled* savings estimate from re-routing — on a sample fleet, no login. Connect your own data in early access.

**› AI-native founder**
Probably overpaying for GPUs on your default cloud. Model your AI compute savings in 2 min — interactive demo, no sign-up. (Numbers are modeled, not promises.) Early access to your own data opening:

### Google Search (Responsive Search Ad — headlines ≤30, descriptions ≤90)

**› ML platform lead**
Headlines: `8-Cloud GPU Price Spread` · `Score Any Cloud 0–100` · `Interactive Demo, No Sign-Up`
Descriptions: `See the H100 price spread across 8 clouds & 13 regions. Live interactive demo.` · `Score every provider & region on cost, carbon & latency. Explore free.`

**› FinOps owner**
Headlines: `Cross-Cloud AI Spend` · `Model Your GPU Savings` · `Demo — No Login Needed`
Descriptions: `See AI compute spend by team, model & region. Modeled savings. Try the demo.` · `Forecasts, anomaly flags & a savings model. Interactive demo, no sign-up.`

**› AI-native founder**
Headlines: `Are You Overpaying for GPUs?` · `Model AI Savings in 2 Min` · `Cross-Cloud Compute Demo`
Descriptions: `Same GPU, very different price across clouds. Model it in 2 minutes, no sign-up.` · `Interactive prototype for cross-cloud AI compute routing. Modeled figures.`

---

## 3) Launch post

### Show HN
**Title:** Show HN: An interactive model of cross-cloud AI compute routing

I got annoyed that the same H100 can cost wildly different amounts across clouds/regions, and that nobody could tell me where a given training or inference job is actually cheapest. So I built GridMind: an interactive model that takes a catalog of 8 providers × 13 regions × GPU types, scores every provider×region placement 0–100 on cost, carbon, latency and reliability ("GridScore"), and routes each workload to its best home under four objectives (cost / speed / carbon / balanced).

**Honest scope:** it's a prototype. The dashboard runs on a **seeded sample fleet** by default, so the headline numbers are **modeled, not real customer results.** You can also connect **read-only** AWS/Azure/GCP billing (or upload a CSV) to see your own spend. The "route in one click" is a **plan/recommendation** — it does not move workloads or touch your account.

What I'd love feedback on: the GridScore weighting, the routing model's assumptions, and whether the savings methodology is fair. Demo is live, no sign-up: [link]

### LinkedIn
I built **GridMind** — an interactive model of cross-cloud AI compute routing.

The premise: where an AI workload runs decides what it costs, and that's mostly invisible. GridMind scores every cloud + region 0–100 on cost, carbon, latency and reliability, then shows where each GPU is cheapest across 8 providers.

Being upfront: this is a **working prototype on a sample dataset** — the numbers are **modeled**, not customer outcomes. You can connect read-only billing or a CSV to see your own. "Route in one click" generates a **migration plan** you apply yourself; it doesn't touch your cloud.

Demo's live, no sign-up. I'm opening early access to connect real data — would love FinOps and ML-platform folks to kick the tires: [link]

### Product Hunt (tagline + first comment)
**Tagline:** An interactive model of where AI compute is cheapest across 8 clouds.
**First comment:** Hey PH 👋 GridMind scores every cloud×region 0–100 on cost/carbon/latency and routes each GPU to its best home. **It's an interactive prototype** — the dashboard runs on a sample fleet (numbers are modeled), and you can connect read-only billing or a CSV for your own. Routing produces a *plan*, not an executed action. No sign-up to explore; early access for real data is opening. Feedback on the model very welcome.

---

## 4) Pre-flight claims checklist (use before every ad / post / page goes out)

- [ ] **Real vs modeled:** Is every number labeled "modeled" / "illustrative" / "in the demo"? No seeded figure stated as a customer result.
- [ ] **Live vs demo:** Called an "interactive demo / prototype / early access" — not "live product," "platform," or "trusted by."
- [ ] **No fabricated proof:** Zero invented testimonials, logos, customer/user counts, ratings, awards, or "$X optimized" totals.
- [ ] **Mechanism-led:** The claim is something verifiable today (price spread, GridScore, routing model, savings *model*) — not an invented outcome.
- [ ] **CTA honesty:** "Explore the demo (no sign-up)" / "Join the waitlist" — never "free trial," "buy," or "start saving today."
- [ ] **Routing honesty:** Nothing implies GridMind moves workloads, reserves capacity, or changes a cloud account. It plans; the user applies.
- [ ] **Data/privacy honesty:** If "connect your data" is mentioned, it's **read-only** and credentials stay in the user's environment.
- [ ] **Comparisons:** No named-competitor claims we can't substantiate; no "cheapest/best" superlatives without a stated, checkable basis.
- [ ] **Specific spread numbers** (e.g. "$1.92–$3.45/hr") match the current catalog — re-verify if the catalog changes.
