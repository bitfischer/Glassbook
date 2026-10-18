# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Hobbyist camera-lens collectors who self-host Glassbook on a home computer or server and browse it from a phone or laptop. One person, one collection. The live instance runs on a private LAN. Other self-hosters of the open-source release are a secondary audience.

## Product Purpose

A private, self-hosted catalogue for a camera lens collection. Each lens gets a page with specifications, purchase details, condition, photos, notes and dated memories. Success is that the collector both finds facts quickly and enjoys opening it to rediscover what they own.

Primary jobs, in order of day-to-day weight:

- Browse and rediscover: lens of the day, the collection grid and the challenge wheel.
- Record and maintain: add lenses, photos, notes and dated memories, and keep the catalogue accurate.

Secondary jobs: look up facts fast (search and filters by manufacturer, ownership, type, era, focal length) and protect the data (one-click backup, validated restore, customizable insurance PDF report).

## Positioning

Not a marketplace, public gallery or shared team tool. It is a notebook for one person's glass that runs entirely on their own machine: one SQLite file plus photos, no account, no cloud, no tracking, nothing that can shut down and take the catalogue with it.

## Operating Context

Docker (`docker compose up`) with SQLite-backed persistent storage under `DATA_DIR`. Installable as a PWA with an offline page. Used on phone and laptop on the home network. Uploaded images and the database are private user data.

## Capabilities and Constraints

- SvelteKit (Svelte 5), TypeScript, SQLite (Drizzle), Node 24+.
- Routes: home (lens of the day), lenses (grid or list, search, filters), lens detail/new/edit, challenge wheel, settings, setup, login, backup, insurance report.
- Auth is optional (`AUTH_ENABLED`); the live instance is deliberately unauthenticated because it is LAN-only.
- Terminology: "lens of the day", "challenge wheel", "memories", prime and zoom focal lengths.

## Brand Commitments

- The name Glassbook and the current mark (`static/brand/glassbook-mark.svg`) stay as they are.
- No cloud and no tracking: no external fonts, CDNs, analytics or third-party network calls; fully self-contained.
- The installable PWA with offline support is a product capability to preserve.

## Evidence on Hand

- README with feature descriptions and screenshots in `docs/screenshots/` (home, collection, lens detail, challenge, mobile), using a demo collection.
- No testimonials, customer claims or usage metrics exist; do not invent any.

## Product Principles

1. Private by construction: nothing leaves the machine, and design never introduces external dependencies.
2. The collection is the star: the lens, its photos and its story lead, and the interface serves them.
3. Worth opening even with nothing to look up: rediscovery (lens of the day, challenge wheel) is a first-class job, not a gimmick.
4. Fast to record, trustworthy to keep: adding and editing must be low-friction, and data safety (backup, restore, export) stays visible and dependable.
5. Built for one person: no multi-user, social or marketplace concepts.

## Accessibility & Inclusion

Target WCAG 2.2 AA.
