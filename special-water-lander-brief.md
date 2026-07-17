# Special Water — Landing Page Build Brief
**Site:** Melt Labs (template will be reused for KAMI later — build reusable, not one-off)
**Reference:** Apple AirPods Pro 3 mobile page structure (see attached screenshots/PDF)
**Brand tone:** "The supplement version of an Apple site." Simple, confident, zero clutter, every claim easy to understand at a glance. No hard-sell language, no walls of text.

---

## 1. BRAND SYSTEM

| Token | Value |
|---|---|
| Primary blue | `#00AEEF` |
| Blue gradient | `linear-gradient(160deg, #00AEEF 0%, #0095D9 100%)` |
| Near-black | `#161616` |
| Pale blue tint (section bg) | `#EAF7FC` |
| White | `#FFFFFF` |
| CTA gold | `#FBB81C` (hover `#E9A912`) — primary buttons ONLY |
| Font | Poppins — 800 weight headlines (near-black), 400/500 body, uppercase letter-spacing on labels |

Design skills active in Code web session: `emil-design-eng` (motion/interaction rules) + `taste-skill` suite (layout/typography/anti-slop). Apply Apple's restraint: generous whitespace, no gratuitous animation, alternating white/pale-blue section rhythm, sticky/scroll-aware header.

---

## 2. TEMPLATE ARCHITECTURE NOTE

Build as a **reusable Liquid section template**, not hardcoded content. Every section below should pull its copy, images, and ingredient data from section schema/settings (or metafields) so the exact same section files can be re-skinned for KAMI later without rebuilding structure. Special Water is the first full build-out; KAMI is a content swap on the same scaffolding.

---

## 3. HOMEPAGE (separate from this product lander)

Keep dead simple — Apple.com-style brand hub, not a sales page:
- Logo/nav, one clean hero (static or light motion), short "two products" or "shop the lineup" module, minimal footer. No long-form copy here. This is the front door; the lander below does the selling.

---

## 4. PRODUCT LANDER — SECTION BY SECTION

### SECTION 1 — Hero (autoplay video)
**Behavior:** Full-bleed autoplay video (muted, looping or short branded loop), scrim overlay for text legibility. Purchase/offer block sits immediately below — no scroll required to see it.

**Copy:**
- Eyebrow: `MELT LABS`
- Headline: **"Two drops. Quiet the cravings. Steady your sugar."**
- Subhead: "A Japanese botanical serum designed to work with your body — not against your routine."
- CTA button (gold): `SEE THE PROTOCOL ↓` (scrolls to offer block)

### SECTION 2 — Offer / Purchase Block
**Behavior:** Build this as a **standard Shopify purchase block** — native "Add to Cart" and "Buy Now" buttons, standard variant/quantity selector, using Shopify's default cart/checkout objects. Do NOT build custom tier logic or hardcode pricing tiers here.

**Why:** Kaching (the pricing/upsell app) auto-injects its three-tier offer UI into the standard buy-box once installed on the storefront — it hooks into the native Shopify purchase block automatically. Building custom tier markup now would just get overridden/conflict with Kaching's injection later. Keep this section clean, native, and standard so Kaching has a normal buy-box to attach to.

**Build note for Code web:** Use theme.liquid's standard `{% form 'product' %}` / buy-box pattern, styled to match brand (gold primary CTA, near-black text, generous tap targets for mobile). Position directly below the hero video per the reference.

### SECTION 3 — Transformation Carousel
**Behavior:** Square photo, text overlay, brief testimonial quote per slide. Duplicate as many slides as you have before/afters (image placeholders for now).

**Sample quote copy (placeholders — swap with real UGC):**
- "I stopped snacking without even trying." — *Placeholder, 34*
- "Two drops in my coffee and the cravings just... quiet down." — *Placeholder, 41*
- "Didn't change anything else. Just added this." — *Placeholder, 29*

### SECTION 4 — Ingredients Breakdown
**Behavior:** List format, each ingredient + plain-language mechanism for weight loss. **Terminology rule: always spell as "Cinnamomum cassia" — never "cinnamon."**

**Active Ingredients (final, locked):**
1. **Cinnamomum cassia (bark) Extract** — The primary active. Supports healthy blood sugar levels and insulin sensitivity, which helps reduce post-meal glucose spikes — the spikes that drive fat storage signaling and cravings.
2. **Japanese Knotweed Extract (Polygonum cuspidatum, root)** — A natural source of trans-resveratrol. The Japanese heritage ingredient and metabolic driver of the formula — supports metabolic health, antioxidant activity, and healthy inflammatory response.
3. **Bitter Melon Extract (Momordica charantia Linn., fruit, 4:1)** — Traditionally used across Asia for metabolic support. Supports healthy blood sugar metabolism and glucose utilization.
4. **Extract of Turmeric Root (Curcuma longa)** — Antioxidant support and healthy inflammatory response, which plays a role in overall metabolic function.
5. **Extract of Licorice Root** — Traditionally used to support digestive health and adrenal function; may support healthy cortisol levels and metabolic balance.
6. **Matcha** — Natural antioxidants (EGCG catechins) that support gentle thermogenesis and a metabolic boost without stimulant jitters.

**Inactive/Base Ingredients:**
7. Water — Base/solvent
8. Glycerin — Natural carrier for botanical extracts, adds slight sweetness
9. Potassium Sorbate — Natural preservative for shelf stability

**Format note:** 2oz/60mL clear glass dropper bottle, blue dropper cap, blue label with kana "スペシャルウォーター."

### SECTION 5 — Bold Benefit Statement → Carousel
**Behavior:** One large bold benefit statement, then a carousel unpacking different angles of it.

**Bold statement:** **"Drink what you already drink. Lose weight seamlessly doing it."**

**Carousel slides:**
1. **Cravings** — "Two drops quiet the noise around food — no willpower required."
2. **Blood Sugar** — "Steadier glucose means fewer spikes, fewer crashes, fewer cravings."
3. **Metabolism** — "Support your body's natural fat-burning response, daily."
4. **Zero Routine Change** — "No pills to remember, no shots, no taste. Just add it to what you're already drinking."

### SECTION 6 — "The Science Behind Special Water"
**Behavior:** Scrollable 3D/video placeholder (real asset comes after theme build — leave clearly labeled placeholder). Transformation photo sequence: normal → transformed, sequenced as scroll progresses.

**Copy:**
- Headline: "The Science Behind Special Water"
- Body: "Special Water was built around one mechanism: stabilizing blood sugar to shut off the cravings that sabotage weight loss. In an in-house study: **93% reported fewer cravings. 90% lost 10+ lbs. 90% saw blood sugar stabilize.**"

### SECTION 7 — Who This Is For
**Behavior:** Simple, scannable — icon + short line each, no paragraphs.

**Copy:**
- People trying to lose weight
- People looking for a long-term solution, not a quick fix
- Natural ("natty") weight loss — no injections
- Sustainable, steady, muscle-preserving
- Easy, low-effort weight control
- People who don't want to worry about it

### SECTION 8 — 1st & 2nd Overall Benefit → Angle Carousel
**Behavior:** Two bold hero-style benefit statements (like Apple's "Intelligent noise control / The best thing you've never heard"), followed by a carousel of different benefit angles.

**Benefit 1:** "Cravings, quieted."
Subhead: "Two drops shift your relationship with food — without restriction."

**Benefit 2:** "Sugar, stabilized."
Subhead: "The mechanism behind sustainable, seamless weight loss."

**Following carousel — different angles:**
- No jitters, no stimulants
- Works in coffee, water, juice, anything
- Tasteless — undetectable in any drink
- Fits into a routine you already have

### SECTION 9 — Potency / Efficacy
**Copy:** "A couple of squirts. That's the entire routine." Body: explain potency lasts through the day, supporting appetite control and blood sugar stability continuously — not a short-lived spike.

### SECTION 10 — Purity & Testing → About Us Carousel
**Copy:** Headline: "Tested. Verified. Trusted." Body: brief line on third-party testing / ingredient purity standards.
**About Us carousel cards** (mirror Apple's "values" cards):
- Our Standards — sourcing and testing commitment
- Our Mission — why Melt Labs exists
- Our Promise — transparency in formulation

### SECTION 11 — Scientific References
**Behavior:** Real citations block, organized by ingredient. Honest framing note: research strength varies by ingredient (cinnamon and green tea catechins have the strongest human clinical support; bitter melon evidence is mixed across trials). Keep claims on-page calibrated to "may support / studied for" language, not guarantees — this also keeps compliance clean.

**Cinnamomum cassia — blood sugar / insulin sensitivity:**
- Wickenberg J, et al. "Cassia cinnamon does not change the insulin sensitivity or the liver enzymes in subjects with impaired glucose tolerance." *Nutrition Journal*, 2014.
- Anderson RA, et al. "Cassia Cinnamon Supplementation Reduces Peak Blood Glucose Responses..." *Journal of the American College of Nutrition*, 2015 — found reduced peak post-meal glucose response.
- ScienceDirect review: "Mechanistic and clinical insights into the antidiabetic potential of Cinnamomum cassia," 2025 — mechanism review on insulin secretion/sensitivity via cinnamaldehyde.

**Japanese Knotweed (Polygonum cuspidatum) — resveratrol / metabolic health:**
- ScienceDirect: "Resveratrol and cardiovascular health," 2014 — trans-resveratrol sourced from P. cuspidatum, cardiovascular/metabolic risk reduction.
- MDPI: "A Comparative Evaluation of the Antioxidant Ability of Polygonum cuspidatum Extracts with That of Resveratrol Itself," 2024/2025 — antioxidant activity confirmation.

**Bitter Melon (Momordica charantia) — glucose metabolism:**
- Kosin University (Korea): 12-week RCT on prediabetic participants — bitter melon extract reduced post-OGTT blood glucose via suppressed glucagon response, published *NCBI/PMC*, 2023.
- Note: A 2024 Frontiers in Nutrition systematic review/meta-analysis found mixed/non-significant results across 9 pooled RCTs — evidence is genuinely contradictory in the literature, so keep claims measured.

**Turmeric (Curcuma longa) — inflammation / metabolic support:**
- Frontiers in Endocrinology: "Effects of dietary polyphenol curcumin supplementation on metabolic, inflammatory, and oxidative stress indices," systematic review/meta-analysis, 2023.
- PMC: "Targeting Inflammation-Induced Obesity and Metabolic Diseases by Curcumin and Other Nutraceuticals" — mechanism review on adipocyte/pancreatic interaction.

**Licorice Root — cortisol / adrenal support:**
- Restorative Medicine Journal: review on Glycyrrhiza's inhibition of 11-beta-hydroxysteroid dehydrogenase (the enzyme that breaks down active cortisol) — mechanism for supporting cortisol availability.

**Matcha (EGCG) — thermogenesis:**
- Hursel R, et al. "The effects of catechin rich teas and caffeine on energy expenditure and fat oxidation: a meta-analysis." *Obesity Reviews*, 2011.
- PMC systematic review: "Effect of Acute and Chronic Dietary Supplementation with Green Tea Catechins on Resting Metabolic Rate, Energy Expenditure and Respiratory Quotient," 2021 — 15 studies, 499 participants.

**In-house study stat citation format:** Display the 93%/90%/90% stats with a small attribution line: *"Based on our in-house study. Individual results may vary."* — do not attribute these to any third-party/clinical source.

---

## 5. FINAL ASSET PLACEHOLDER POLICY
All final media (hero video, scrollable 3D "Science" asset, transformation photos, ingredient start-frame images) will be produced **after** the theme is built. Every section that needs one of these must ship with a **clearly labeled, correctly-sized placeholder** (matching final aspect ratio/dimensions) so drop-in later causes zero layout shift. Use HTML comments in each section file naming exactly what asset goes where, e.g. `<!-- SWAP: hero_autoplay_video, 9:16 mobile / 16:9 desktop -->`.

---

## 6. FEATURE / TECHNICAL REQUIREMENTS
- Autoplay hero video (muted, mobile-optimized, lazy-loaded below fold sections)
- Standard Shopify buy-box (Add to Cart / Buy Now) — Kaching auto-injects its tier UI on install, no custom tier logic needed
- Scroll-scrubbed / scrollable video placeholder for Science section, exact final dimensions specified in placeholder comment
- Multiple carousel components (testimonials, benefit angles, about-us cards) — build ONE reusable carousel snippet, reference it across sections rather than rebuilding per section
- Sticky/scroll-aware header
- Fully responsive, mobile-first (this is a mobile-optimized site per your direction)
- Built in native Liquid/CSS/JS — no page builder
- Section schema designed for reuse across future product lines (KAMI next)

**Performance / speed optimization (required, not optional):**
- Lazy-load every image and video below the fold; hero video only loads eagerly
- Serve responsive image sizes via Shopify's `image_url` / `srcset`, no oversized assets
- Minify and defer non-critical CSS/JS; no render-blocking scripts in `<head>`
- Use native `loading="lazy"` and `decoding="async"` on all non-hero images
- Keep custom JS lightweight — avoid heavy animation libraries; CSS transitions/animations preferred per Emil's skill rules
- Test against Shopify's theme performance guidelines / Lighthouse mobile score before calling any section "done"

---

## 7. MASTER KICKOFF PROMPT — paste this directly into Code web
```
Read docs/lander-brief.md in full and the reference images/PDF in docs/reference/.
This is the complete, final build brief for the Special Water product landing
page (Melt Labs) — all copy, ingredients, citations, brand colors, and technical
requirements are locked and final in that file.

Using the emil-design-eng and taste-skill skills:
1. Produce a section-by-section file/build plan (sections, snippets, schema) —
   do not write code yet. Flag any genuine ambiguity before starting.
2. Once I approve the plan, build one section at a time, matching the Apple
   reference structure and pacing for scroll rhythm and section order.
3. Every final-media slot (video, scrollable 3D asset, transformation photos)
   must ship as a clearly labeled placeholder at correct final dimensions —
   see Section 5 of the brief for the exact policy.
4. The purchase block must use Shopify's native buy-box only — no custom
   pricing tier logic, Kaching handles that on install.
5. Optimize for speed per Section 6 of the brief (lazy loading, responsive
   images, minimal JS, no render-blocking assets) as you build, not as a
   pass at the end.
6. Build every section as reusable Liquid (schema-driven), since this exact
   template gets re-skinned for KAMI next — no hardcoded Special Water-only
   markup where a setting/metafield would work instead.

Confirm the plan with me before writing code.
```
