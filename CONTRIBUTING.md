# Contributing to Apply Copilot

Thanks for your interest! This is a small, opinionated project — contributions
that keep it simple and private-by-default are very welcome.

## Getting set up

```bash
pnpm install
pnpm dev          # http://localhost:3000 — no config needed (embedded local DB)
```

There's nothing else to install: the app uses an embedded PGlite database that is
created and migrated on first run. AI features are optional — pick a provider in
the header, or copy `.env.example` to `.env.local` to set defaults.

## Before you open a PR

Run the same checks CI runs (`.github/workflows/ci.yml`). All must pass:

```bash
pnpm typecheck        # tsc --noEmit
pnpm lint             # ESLint
pnpm format:check     # Prettier (run `pnpm format` to fix)
pnpm test:coverage    # Jest + RTL, ≥80% on application logic
pnpm build            # production build
```

For UI-affecting changes, also sanity-check `pnpm e2e` (Playwright) and the
component workshop (`pnpm storybook`).

## Sign your commits (DCO)

Contributions are accepted under the [Developer Certificate of Origin](https://developercertificate.org/):
by signing off you certify you wrote the change (or have the right to submit it)
under the project's MIT license. Add a sign-off line to each commit with `-s`:

```bash
git commit -s -m "fix: ..."   # appends "Signed-off-by: Your Name <you@example.com>"
```

## Conventions

- **Commits** follow [Conventional Commits](https://www.conventionalcommits.org/):
  `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `perf:`, `ci:`.
- **Small files, high cohesion** — prefer many focused modules over large ones
  (target < 400 lines, 800 hard max). Organize by feature under `src/features/`.
- **Validate at boundaries** — every API route parses input with a Zod schema
  before touching the database. Re-use the schemas in `src/lib/**/schemas.ts`.
- **Provider-agnostic AI** — never hardcode a provider. Add one by appending a
  row to `src/lib/ai/providers.ts` (the single source of truth).
- **Tests for new logic** — non-trivial behaviour ships with a test. Pure logic
  lives in `*.ts` with a sibling `*.test.ts`; components use React Testing Library.
- **No secrets in code** — keys come from env only; `.env.local` is gitignored.

## Architecture in one minute

- **Next.js App Router** (`src/app/`) — pages + API routes (`runtime = "nodejs"`).
- **Features** (`src/features/`) — self-contained UI slices (board, analyze,
  cover-letter, cv, profile, provider, stats, theme).
- **Lib** (`src/lib/`) — AI layer, applications/profiles repositories + schemas.
- **DB** (`src/db/`) — Drizzle ORM with a dual driver: embedded PGlite by default,
  Postgres when `DATABASE_URL` is set. See [EDITIONS.md](EDITIONS.md).

## Scope

This is the **open-source edition** — local-first, self-hostable, no account
required. Hosted/SaaS concerns (auth, billing, metering) are intentionally out of
scope here; see [EDITIONS.md](EDITIONS.md) for how that layers on top without a
fork. PRs that would require a fork to keep the OSS edition self-hostable will be
asked to take the env-gated approach instead.

## Reporting bugs / requesting features

Use the issue templates under **Issues → New issue**. Include repro steps, your
provider/DB setup, and what you expected.
