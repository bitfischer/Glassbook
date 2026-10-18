---
target: bottom navigation bar (phone PWA)
total_score: 20
max_score: 32
na_heuristics: 9,10
p0_count: 0
p1_count: 2
target_identity: 'file:/home/florian/workspace/Glassbook/src/routes/+layout.svelte'
target_fingerprint: 'sha256:391fe0d91908fc6c8ddd3fdcf690213f0d8f07afac652007746fabd957222e0e'
target_path: /home/florian/workspace/Glassbook/src/routes/+layout.svelte
timestamp: 2026-10-18T09-44-44Z
slug: src-routes-layout-svelte
---

Method: dual-agent (A: a4660eb8569b33a57 · B: a86be23763665622e)

# Critique: bottom navigation bar (src/routes/+layout.svelte, .main-nav in src/app.css), phone PWA use

Score 20/32 (Acceptable). Heuristics 9 and 10 scored n/a (do not apply to a nav bar).

| #   | Heuristic                   | Score | Key issue                                               |
| --- | --------------------------- | ----- | ------------------------------------------------------- |
| 1   | Visibility of system status | 3     | No press feedback                                       |
| 2   | Match with real world       | 3     | "Challenge" opaque to newcomers                         |
| 3   | User control and freedom    | 2     | No back affordance in standalone PWA; accidental swipes |
| 4   | Consistency and standards   | 3     | Text-only tab bar is unusual                            |
| 5   | Error prevention            | 2     | Page swipes misfire; bar stays up while editing         |
| 6   | Recognition over recall     | 2     | No icons; 10.7px labels                                 |
| 7   | Flexibility and efficiency  | 2     | Add lens hidden on phones                               |
| 8   | Aesthetic and minimalism    | 3     | Blur and shadow heavier than brief                      |

## Specificity

Generic four-label tab bar; ink pill is the on-brand element; orange absent. Detector: nothing on +layout.svelte; 73 advisory across src (drift only).

## Priority issues

1. [P1] Add lens unreachable one-handed on phones (hidden <=760px, app.css:1483). Command: layout.
2. [P1] Swipe-between-tabs fires from horizontal scrollers (card galleries) and misroutes from /lenses/126 to Challenge. Command: harden.
3. [P2] Labels 10.72px, dead clamp rule at app.css:1481, no icons. Command: typeset, delight.
4. [P2] Standalone PWA gaps: no viewport-fit=cover, dark theme-color/manifest vs paper app, no back affordance, no press feedback. Command: adapt, animate.
5. [P3] Bar stays up on edit forms (A saw overlap; B measured field not covered on Android; iOS unmodelled). Command: adapt.

## Measured (B)

Bar 60px; tabs 45.6px tall, 90.5px wide at 390; labels 10.72px (11.39 landscape); inactive contrast 6.3-8.2, active 13.4-15.0; clearance above bar 28px on all routes; aria-current correct; one labelled nav landmark, after main in DOM; focus visible; fixed positioning intact; swipe from card gallery navigated to /challenge (synthetic events).

## Personas

Casey: Add out of reach, accidental swipe. Sam: nav after main, no skip link, small labels. iPhone collector: no safe area, dark status bar/splash, no back.

## Minor

Dead/overlapping nav CSS; 126px of chrome on phones; permanent will-change; sparse landscape tabs; upward shadow; theme toggle could move to Settings.
