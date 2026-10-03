# Repository Guidelines

## Project Structure & Module Organization

Glassbook is a SvelteKit app for a private lens catalogue. Application routes live in `src/routes`, shared UI and domain code in `src/lib`, and server-only persistence code in `src/lib/server`. Database schema and seed logic are under `src/lib/server/db`. Static assets are in `static/`, with generated brand assets in `static/brand/`. Unit tests live in `tests/unit/`. Helper scripts such as brand optimization and image import live in `scripts/`.

## Build, Test, and Development Commands

Use Node.js 24 or newer.

- `npm install`: install dependencies.
- `npm run dev`: start the local Vite dev server.
- `npm run check`: run `svelte-kit sync` and `svelte-check` for type and Svelte diagnostics.
- `npm test`: run all Vitest tests.
- `npm run test:unit`: run unit tests only.
- `npm run build`: create the production build.
- `npm run lint`: run Prettier check and ESLint.
- `docker compose up --build -d`: run the app with SQLite-backed persistent storage.

## Coding Style & Naming Conventions

Use TypeScript and Svelte with consistent two-space indentation. Keep route files in SvelteKit naming form such as `+page.svelte`, `+page.server.ts`, and `+layout.svelte`. Prefer clear camelCase for variables and functions, and PascalCase only for component-like identifiers if introduced. Format with Prettier and lint with ESLint before submitting changes.

## Testing Guidelines

Vitest is used for automated tests. Add tests in `tests/unit/*.test.ts`, matching the existing naming pattern like `domain.test.ts` or `lenses.test.ts`. Cover new filtering, parsing, or validation logic with focused assertions. Run `npm run test:unit` during feature work and `npm run check` before opening a PR.

## Commit & Pull Request Guidelines

Recent history uses short, imperative subjects such as `Add initial Glassbook application` and `Add prime and zoom focal length fields`. Follow that pattern: one-line, present-tense summaries focused on the user-visible change. For pull requests, include a brief description, testing performed, and screenshots for UI changes. Mention any config or data-impacting changes, especially around `DATA_DIR`, uploads, or SQLite schema updates.

## Security & Configuration Tips

Do not commit the local `data/` directory or secrets. Set `ORIGIN` correctly when running behind a proxy so form submissions and secure cookies work as expected. Treat uploaded images and the SQLite database as private user data.
