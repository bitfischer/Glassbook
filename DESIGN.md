---
name: Glassbook
description: A private, self-hosted notebook for a camera lens collection: paper, ink and one orange aperture accent.
colors:
  paper: "#f6f3eb"
  paper-deep: "#ece9e0"
  surface: "#fffdf8"
  ink: "#17263a"
  ink-soft: "#425064"
  muted: "#596159"
  accent: "#dc5839"
  accent-fill: "#c24427"
  accent-hover: "#a63a20"
  accent-ink: "#b13d22"
  teal: "#1b6974"
  line: "#d8d3c8"
  line-strong: "#aaa69d"
  danger: "#a93b35"
  field-bg: "#fffefa"
  field-border: "#c8c3b8"
  stage-bg: "#e9e6dc"
  night-paper: "#17191e"
  night-paper-deep: "#0f1013"
  night-surface: "#1c1f24"
  night-ink: "#ece7db"
  night-accent: "#e86b4d"
  night-teal: "#4bb0bd"
typography:
  display:
    fontFamily: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif"
    fontSize: "clamp(2.45rem, 5vw, 4.65rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.055em"
  headline:
    fontFamily: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif"
    fontSize: "1.35rem"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  body:
    fontFamily: "'Avenir Next', Avenir, 'Segoe UI', 'Century Gothic', system-ui, sans-serif"
    fontSize: "0.91rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "'Avenir Next', Avenir, 'Segoe UI', 'Century Gothic', system-ui, sans-serif"
    fontSize: "0.7rem"
    fontWeight: 800
    letterSpacing: "0.18em"
  mono:
    fontFamily: "'SFMono-Regular', 'Cascadia Mono', 'JetBrains Mono', 'Roboto Mono', ui-monospace, 'Courier New', monospace"
    fontSize: "0.74rem"
    fontWeight: 400
rounded:
  xs: "2px"
  sm: "3px"
  md: "4px"
  pill: "999px"
components:
  button-primary:
    backgroundColor: "{colors.accent-fill}"
    textColor: "#ffffff"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0.68rem 1.05rem"
    height: "46px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "#ffffff"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.sm}"
    padding: "0.68rem 1.05rem"
    height: "46px"
  button-ghost-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.danger}"
    rounded: "{rounded.sm}"
  input:
    backgroundColor: "{colors.field-bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xs}"
    padding: "0.65rem 0.75rem"
    height: "46px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  badge:
    backgroundColor: "rgb(27 105 116 / 8%)"
    textColor: "{colors.teal}"
    typography: "{typography.label}"
    rounded: "{rounded.xs}"
    padding: "0.28rem 0.52rem"
---

# Design System: Glassbook

## Overview

**Creative North Star: "The Lens Notebook"**

Glassbook looks like a well-kept field notebook for glass. Warm paper stock (`paper`, `surface`) carries navy ink, and a single orange accent stands in for the iris of an aperture. Headings are set in an old-style serif, working text in a humanist sans, and the measurable facts of a lens (focal length, aperture, serial) in monospace, so a page reads as handwritten prose around precise entries.

The system is dense enough to scan a collection and calm enough to be opened for pleasure. It is crisp and tactile: small corners, hairline borders, and soft ambient shadows that respond to touch. Dark mode is the same notebook by lamplight, not a different product: ink and paper swap, the accent warms slightly, and the teal lifts.

It is not a generic SaaS dashboard (no cold blue-gray admin chrome, KPI-tile styling or stock gradients) and not a marketplace (no storefront, price-tag or cart aesthetics). It is a private notebook for one person's collection.

**Key Characteristics:**

- Warm paper neutrals with navy ink; one orange accent; teal as a quiet secondary for focus, tags and locked states.
- Serif display, sans body, mono metadata: three voices with fixed jobs.
- 2-4px corners and hairline borders; shapes are drafted, not bubbly.
- Ambient shadows that lift on hover; the top bar is a blurred glass strip.
- A faint horizontal ruling over the page background, like lined paper.
- Light and dark themes both first-class, with a manual toggle and system default.

## Colors

A restrained, warm palette: paper and ink do the work, orange is the signature, teal is the supporting note. Values below are the light theme; the dark theme remaps the same roles.

### Primary

- **Aperture Orange** (#dc5839; dark #e86b4d): the only accent, used for the iris in the logo, glows and the wheel. Wherever it carries text it comes in two deeper forms: **Aperture Fill** (#c24427) behind white text on buttons, the active nav pill and the filter count, and **Aperture Ink** (#b13d22) for orange text. Both clear AA. Hover deepens the fill to **Burnt Aperture** (#a63a20). In dark mode the fill is the bright orange with ink-dark text.

### Secondary

- **Optic Teal** (#1b6974; dark #4bb0bd): eyebrow labels, input focus border and ring, spec badges, locked wheel segments and soft background glows. It signals state and metadata, never primary action.

### Neutral

- **Paper** (#f6f3eb) and **Paper Deep** (#ece9e0): page and canvas, with radial orange and teal glows on the body.
- **Surface** (#fffdf8): cards, panels and the glass top bar (88% opaque).
- **Navy Ink** (#17263a): primary text. **Soft Ink** (#425064) for labels and secondary text. **Muted Sage** (#596159) for metadata.
- **Pencil Line** (#d8d3c8) for hairlines, **Graphite Line** (#aaa69d) for stronger dividers and ghost borders.
- **Stage Gray** (#e9e6dc): the photo stage behind a lens image.
- **Field** (#fffefa) with **Field Border** (#c8c3b8): inputs.
- **Brick Red** (#a93b35; dark #e0736c): destructive actions and errors only.
- Dark theme neutrals: night paper (#17191e), deep (#0f1013), surface (#1c1f24), ink (#ece7db).

### Named Rules

**The One Aperture Rule.** Orange is the only accent and marks the one thing to act on or notice on a screen: one filled orange button per screen, ghost for the rest. The active nav pill is ink, not orange, so "where you are" never competes with "what to do". Teal never competes with it.

**The Paper and Ink Rule.** Never pure black or pure white as surfaces or text; neutrals stay warm and tinted toward the paper, with ink tinted toward navy.

## Typography

**Display Font:** Iowan Old Style (with Palatino Linotype, Palatino, Georgia, serif)
**Body Font:** Avenir Next (with Avenir, Segoe UI, Century Gothic, system-ui, sans-serif)
**Label/Mono Font:** SFMono-Regular (with Cascadia Mono, JetBrains Mono, Roboto Mono, ui-monospace, monospace)

**Character:** A bookish serif for names and headings over a clean humanist sans, with monospace entries for specs. All fonts are system fonts; nothing is loaded from the network, per the product's no-external-dependencies commitment.

### Hierarchy

- **Display** (600, clamp(2.45rem, 5vw, 4.65rem), 1.08, -0.055em): page titles and the hero lens name.
- **Headline** (600, ~1.35rem, 1.08, -0.025em): section headings, panel titles and the challenge rule.
- **Body** (400, 0.91rem, 1.65): working text and form values. Keep prose to 65-75ch.
- **Label** (800, 0.7-0.78rem, 0.035-0.18em, uppercase for eyebrows and badges): eyebrows, form labels, badges.
- **Mono** (400, 0.74rem): lens metadata strings separated by a faint slash (e.g. focal length / aperture / mount).

### Named Rules

**The Three Voices Rule.** Serif names things, sans explains things, mono measures things. Do not swap roles.

## Layout

A content column of about 1240px, centered, with at least 1.25rem side padding. The sticky top bar holds the brand, a flexible search/context area and navigation. The collection is a card grid (grid or list view) with a collapsible filter panel above it. Responsive steps happen at 1080px (grid to two columns, topbar chips hide), 760px (topbar becomes two rows, tighter padding) and 520/400px (single column, compact controls). Interactive targets are at least 44-46px tall on primary controls. Spacing is rem-based and comfortable rather than tight, around 0.45-1.2rem between related items and larger rhythm between sections.

## Elevation & Depth

A hybrid: surfaces sit on the page by hairline border first, and shadows are soft, ambient and navy-tinted. Depth responds to interaction.

### Shadow Vocabulary

- **Resting card** (`box-shadow: 0 18px 45px rgb(23 38 58 / 7%)`): cards and panels at rest.
- **Lifted card** (`box-shadow: 0 22px 46px rgb(23 38 58 / 13%)`): lens cards and rows on hover, with a 4px rise.
- **Button glow** (`box-shadow: 0 7px 16px rgb(186 67 41 / 12%)`, hover `0 9px 20px … / 18%`): primary buttons only.
- **Top bar** (`box-shadow: 0 12px 32px rgb(23 38 58 / 7%)` with `backdrop-filter: blur(18px) saturate(130%)`): the glass nav strip.
- **Focus ring** (`0 0 0 3px rgb(27 105 116 / 12%)` for fields; a 3px orange 35% outline for keyboard focus).

### Named Rules

**The Lift On Touch Rule.** Raised elements rest quietly and rise only when hovered or focused. Never stack shadow and a heavier border at rest.

## Shapes

Drafted, not bubbly. Inputs and badges use 2px corners, buttons 3px, cards and panels 4px. Pills (999px) are reserved for small counters such as the filter count. Photos sit in 4:3 stages with a hairline bottom edge. The logo is an iris aperture: a ring with blades and an orange center.

## Components

### Buttons

- **Shape:** gently squared (3px radius), 46px tall (36px small).
- **Primary:** Aperture Orange fill, warm white text, 800 weight, subtle orange glow.
- **Hover / Focus:** deepens to Burnt Aperture and rises 1px; keyboard focus shows a 3px orange 35% outline offset by 3px.
- **Ghost:** transparent with a Graphite Line border and Soft Ink text; on hover it fills with Navy Ink.
- **Danger:** transparent with a muted red border; fills Brick Red on hover.

### Cards / Containers

- **Corner Style:** 4px.
- **Background:** Surface, with a Pencil Line border.
- **Shadow Strategy:** resting then lifted, per Elevation.
- **Lens card:** a 4:3 photo stage on a teal-tinted radial wash, then name, meta line in mono and badges; it lifts on hover.

### Inputs / Fields

- **Style:** 2px radius, Field background, Field Border hairline, 46px height; label above in 800-weight Soft Ink.
- **Focus:** border shifts to Optic Teal with a soft teal ring.
- **Error:** Brick Red text with a hairline top rule.

### Badges and Chips

- **Style:** uppercase 800-weight label on a teal 8% tint with a teal 25% hairline, 2px radius. The filter count is an orange pill.

### Navigation

- **Desktop and tablet (761px and up):** one sticky glass strip at the top: brand on the left, the four text tabs (Home, Collection, Challenge, Settings) in the middle, `Add lens` and the theme toggle on the right. There is no bottom bar. Collection counts live on the collection page, not in the strip.
- **Phone (760px and below):** the bottom bar is Home, Collection, a raised **Add** disc, Challenge, each with a 22px line icon above a 12px label. The Add disc is the one filled orange control on phone screens, so `Open lens`, `Edit lens` and `Spin` turn into ghost buttons there. Settings becomes a sliders icon in the top bar beside the theme toggle. The active tab is an ink pill with inverted text.
- **Nested pages:** a back chevron appears in the top bar on lens detail, new and edit. On new and edit the bar gives way to a sticky Save and Cancel bar.
- **Standalone PWA:** `viewport-fit=cover`, safe-area insets on the top bar and bottom bar, a paper-toned `theme-color` that follows the theme, and a short press state on tabs (off for reduced motion).
- **Swipe between pages** works only from the four main pages and never from photo galleries, the wheel, the home photo or any horizontally scrolling area.

### Photo-less lenses and the add form

A lens without a photo gets a typeset plate on tinted paper: focal length in the display serif, the aperture in mono, and a small "No photo yet" note. The collection can be filtered to lenses with or without photos. On new lenses the add form shows Identity and Optics only; Physical details and Ownership and purchase fold away and stay open when editing.

### Brand mark

The iris-aperture mark with a serif wordmark. On hover of the brand link the orange iris closes slightly and rotates 20°.

### Challenge Wheel (signature)

A conic-segmented wheel with a center hub and pointer; segments can be locked in teal. Results lead with a creative-rule block (hairline orange-tinted border), then matching lenses as links, then the lockable ingredients.

### Lens of the day (home)

A two-column feature card: a bounded 4:3 photo stage (max 68vh) with arrows, dots and pause over the image, beside the maker, name, specs, the latest memory or note in the serif, and the one filled `Open lens` button. It stacks under 760px.

## Do's and Don'ts

### Do:

- **Do** use Aperture Orange for the single primary action or notice on a screen.
- **Do** set lens names and headings in the serif, labels in the sans and measurements in mono.
- **Do** keep corners to 2-4px and borders to hairlines; use shadow for response, not decoration.
- **Do** keep both light and dark themes equally finished, remapping roles rather than inverting.
- **Do** use only system fonts and local assets, keeping the product self-contained.
- **Do** keep primary controls at least 44px tall and honor `prefers-reduced-motion`.

### Don't:

- **Don't** make it a generic SaaS dashboard: no cold blue-gray admin chrome, KPI tiles or stock gradients.
- **Don't** make it a marketplace: no storefront, price-tag or cart aesthetics.
- **Don't** use pure black or pure white as a background or text color.
- **Don't** add a second accent color that competes with the orange.
- **Don't** add thick colored side or top stripes to cards for emphasis.
- **Don't** put orange text below AA contrast: use Aperture Ink, not Aperture Orange, for small orange type.
- **Don't** load web fonts, CDNs or other external assets.
