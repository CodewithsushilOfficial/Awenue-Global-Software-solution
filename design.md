# Awenue — Design System & Landing Page Spec

## 1. Context and Goals

Awenue is an enterprise software development agency (CRM/ERP/HRMS/LMS products + custom builds). The landing page's single job: **make an operator or CTO trust Awenue enough to book a consultation.** This spec is implementation-ready, token-driven, and covers the hero pattern the site is standardizing on (large headline + supporting line + single primary CTA + decorative graphic — the same structural idea requested from the reference layout, rebuilt with Awenue's own visual identity, copy, and assets rather than reused code/imagery).

Audience: founders, CTOs, operations leads evaluating a dev partner. Surface: public marketing site (unauthenticated).

---

## 2. Design Tokens & Foundations

### 2.1 Color — semantic tokens

Dark-first hero/nav, light content sections for readability at length. All pairs below meet WCAG 2.2 AA (4.5:1 body text, 3:1 large text/UI).

| Token                        | Hex                      | Usage                                                                       |
| ---------------------------- | ------------------------ | --------------------------------------------------------------------------- |
| `color.surface.base`         | `#0A0F0D`                | Hero, nav, footer background (near-black, not pure #000 — reduces halation) |
| `color.surface.raised`       | `#121917`                | Cards/panels on dark sections                                               |
| `color.surface.light`        | `#FFFFFF`                | Content sections (Services, Products, FAQ)                                  |
| `color.surface.light-alt`    | `#F5F7F6`                | Alternating light section background                                        |
| `color.text.primary`         | `#14212B`                | Body/headings on light surfaces                                             |
| `color.text.secondary`       | `#FFFFFF`                | Headings/body on dark surfaces                                              |
| `color.text.tertiary`        | `#575A7B`                | Captions, metadata, muted copy (both surfaces, check contrast per bg)       |
| `color.text.on-dark-muted`   | `#A7B0AC`                | Secondary copy on dark surfaces (passes AA on `surface.base`)               |
| `color.accent.primary`       | `#09B850`                | Primary CTA, links, active states, key highlights                           |
| `color.accent.primary-hover` | `#078A3D`                | Hover/pressed state for accent                                              |
| `color.accent.primary-tint`  | `#0BCF5F`                | Glow/gradient highlight, decorative use only — never for text on white      |
| `color.border.dark`          | `rgba(255,255,255,0.10)` | Dividers, card borders on dark                                              |
| `color.border.light`         | `#E3E7E5`                | Dividers, card borders on light                                             |
| `color.state.error`          | `#E5484D`                | Form errors                                                                 |
| `color.state.success`        | `#09B850`                | Confirmations (reuses accent)                                               |

**Contrast checks (must-pass):**

- `#FFFFFF` on `#0A0F0D` → 19.6:1 ✅
- `#A7B0AC` on `#0A0F0D` → 8.1:1 ✅
- `#14212B` on `#FFFFFF` → 14.8:1 ✅
- `#09B850` on `#0A0F0D` (large text/icons only) → 6.9:1 ✅
- White text on `#09B850` button → 2.1:1 ❌ — **buttons must use `#0A0F0D` text on `#09B850` fill**, not white-on-green.

### 2.2 Typography

- `font.family.primary` = Plus Jakarta Sans; `font.family.stack` = `"Plus Jakarta Sans", sans-serif`
- Base: `font.size.base=17px`, `font.weight.base=600`, `font.lineHeight.base=28.9px` (1.7×)

| Token           | Size | Weight | Line-height | Use                        |
| --------------- | ---- | ------ | ----------- | -------------------------- |
| `font.size.xs`  | 14px | 600    | 20px        | Labels, eyebrows, badges   |
| `font.size.sm`  | 16px | 600    | 24px        | Captions, form helper text |
| `font.size.md`  | 17px | 600    | 28.9px      | Body copy (base)           |
| `font.size.lg`  | 20px | 700    | 28px        | Card titles, sub-headings  |
| `font.size.xl`  | 28px | 700    | 34px        | Section titles             |
| `font.size.2xl` | 32px | 700    | 38px        | Section titles (large)     |
| `font.size.3xl` | 40px | 800    | 46px        | Sub-hero headline / H2     |
| `font.size.4xl` | 56px | 800    | 60px        | Hero H1                    |

Body weight of 600 is intentional and load-bearing for this brand — do not substitute 400/500 regular weights; it's what gives Awenue's copy its "confident, engineered" voice. Reserve 800 for H1/H2 only.

### 2.3 Spacing scale

`space.1=5px · space.2=8px · space.3=16px · space.4=20px · space.5=21px · space.6=24px · space.7=25px · space.8=30px`

Section vertical rhythm: mobile `space.6` (24px) top/bottom padding between stacked elements, `space.8×3` (~90px) between major sections on desktop. No one-off pixel values outside this scale.

### 2.4 Radius, shadow, motion

| Token                     | Value                            | Use                                |
| ------------------------- | -------------------------------- | ---------------------------------- |
| `radius.sm`               | 8px                              | Inputs, small chips                |
| `radius.md`               | 14px                             | Cards                              |
| `radius.lg`               | 24px                             | Hero CTA button, large panels      |
| `radius.pill`             | 999px                            | Nav pills, badges                  |
| `shadow.card`             | `0 8px 24px rgba(10,15,13,0.08)` | Light-surface cards                |
| `shadow.glow`             | `0 0 40px rgba(9,184,80,0.25)`   | Accent glow behind hero art only   |
| `motion.duration.instant` | 200ms                            | Hover color/opacity changes        |
| `motion.duration.fast`    | 500ms                            | Section reveal, hero load sequence |
| `motion.easing`           | `cubic-bezier(0.16,1,0.3,1)`     | All eased transitions              |

`prefers-reduced-motion: reduce` **must** disable the hero load sequence and any scroll-reveal, falling back to opacity-only, no-delay appearance.

---

## 3. Hero Component — Anatomy, Variants, States

### Anatomy

1. Eyebrow badge (optional, pill, accent border) — e.g. "Enterprise Software Partner"
2. H1 (`font.size.4xl`, `color.text.secondary`) — max 2 lines desktop, wraps naturally mobile
3. Supporting paragraph (`font.size.md`, `color.text.on-dark-muted`) — max ~180 characters
4. CTA group: 1 primary button (filled, accent) + 1 secondary (ghost/outline) — never more than 2 at hero level
5. Trust strip: 3–4 short proof lines with checkmark icons
6. Decorative art: abstract accent-green gradient shape/orb, positioned bottom-right or full-bleed behind content — original asset, not reused template imagery

### Responsive behavior

- **Desktop (≥1024px):** two-zone layout, copy left (max-width 640px), decorative art right/behind, CTA row horizontal
- **Tablet (768–1023px):** copy centered, art scaled down behind, CTA row horizontal, trust strip wraps to 2 columns
- **Mobile (<768px):** single column, H1 drops to `font.size.3xl` (40px) to avoid awkward wraps, CTA buttons stack full-width, trust strip becomes single column list

### States (primary CTA button)

| State          | Spec                                                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Default        | Fill `color.accent.primary`, text `color.surface.base`, `radius.lg`, `space.4` vertical / `space.6` horizontal padding |
| Hover          | Fill `color.accent.primary-hover`, `transform: translateY(-1px)`, `motion.duration.instant`                            |
| Focus-visible  | 2px solid `color.accent.primary-tint` outline, 2px offset — **never suppressed**                                       |
| Active/pressed | Fill `color.accent.primary-hover`, `transform: translateY(0)`, no shadow                                               |
| Disabled       | Opacity 0.45, `cursor: not-allowed`, no hover/active transform                                                         |
| Loading        | Label replaced with spinner (aria-live="polite", "Submitting…" announced), button width locked to prevent layout shift |

### Keyboard, pointer, touch

- CTA and secondary button are real `<button>`/`<a>` elements — never `<div onclick>`.
- Tab order: eyebrow (if link) → H1 (not focusable) → primary CTA → secondary CTA → trust strip links (if any).
- Touch target minimum 44×44px on all interactive elements, including on mobile stacked buttons.
- Decorative art must carry `aria-hidden="true"` — it is never announced or focusable.

### Edge cases

- Long headline (client renames product): H1 must support 3 lines on mobile without clipping; no `overflow: hidden` on hero text.
- No-JS fallback: hero must render fully static (no motion) if JS fails to load — motion is progressive enhancement only.
- Slow-loading decorative art: reserve fixed aspect-ratio box to prevent CLS; show `surface.raised` placeholder tone until loaded.

---

## 4. Accessibility Requirements (WCAG 2.2 AA)

| Rule                 | Acceptance test                                                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Text contrast        | Every text/background pair ≥4.5:1 (body) / ≥3:1 (≥24px or 19px+bold) — verified against tokens in §2.1, not spot-checked                                                                   |
| Focus visibility     | Every interactive element shows a ≥2px, ≥3:1-contrast focus outline on `:focus-visible`; tabbing through the hero with a mouse plugged in produces no visible outline until Tab is pressed |
| Keyboard operability | Entire hero (CTAs, nav) operable via Tab/Shift+Tab/Enter/Space with no keyboard trap                                                                                                       |
| Target size          | All buttons/links ≥24×24px CSS px minimum, ≥44×44px on primary CTAs                                                                                                                        |
| Reduced motion       | With OS `prefers-reduced-motion: reduce` set, hero load animation is disabled (pass = no transform/translate animation fires, verified in DevTools)                                        |
| Non-color status     | Loading/error/success states never rely on color alone — spinner icon + text label required                                                                                                |
| Alt text             | Decorative hero art: `alt=""` + `aria-hidden="true"`. Any meaningful image (logos, screenshots) gets descriptive alt text, not filename or "image of…"                                     |

---

## 5. Content & Tone Standards

Voice: concise, confident, implementation-focused — the copy sells competence, not adjectives.

**Do:**

- "Start Your Project" (specific action) — not "Learn More"
- "See a live staging link from Week 2" (concrete, testable claim) — not "We're transparent"

**Don't:**

- Unverifiable superlatives ("#1 software agency") without a source
- Vague CTAs ("Click Here", "Submit")
- Feature-speak in place of outcome-speak ("We use Kubernetes" alone, without what that gets the client)

---

## 6. Anti-Patterns / Prohibited Implementations

- No hardcoded hex values in component code — reference tokens only.
- No white text directly on `#09B850` fill (fails contrast) — see §2.1.
- No custom one-off spacing (e.g. `padding: 18px 22px`) outside the defined scale.
- No `<div>`-as-button patterns; no removing focus outlines via `outline: none` without a replacement style.
- No motion that fires regardless of `prefers-reduced-motion`.
- No more than 2 CTAs competing for primary attention in the hero.
- No decorative shape/art reused verbatim from a third-party commercial template — build an original asset from the token palette.

---

## 7. QA Checklist (pre-ship)

- [ ] All hero text passes contrast checks in §2.1 (tested with an automated contrast checker, not eyeballed)
- [ ] Keyboard-only pass: can Tab through nav → hero CTAs → trust strip with visible focus at every stop
- [ ] `prefers-reduced-motion: reduce` disables hero animation (tested in browser dev tools)
- [ ] Hero renders correctly at 375px, 768px, 1024px, 1440px
- [ ] No CLS from hero art loading (Lighthouse CLS score checked)
- [ ] All buttons are real interactive elements (inspected in DOM, not styled divs)
- [ ] Touch targets ≥44×44px confirmed on mobile viewport
- [ ] Copy reviewed against §5 — no vague CTAs, no unverifiable claims
- [ ] No raw hex values in shipped CSS — token references only
