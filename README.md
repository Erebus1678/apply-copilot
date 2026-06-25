# Apply Copilot

An AI copilot for job applications. Paste a job description and it extracts the
tech stack, seniority, and role archetype; scores the fit against your CV with a
concrete gap list; drafts a tailored cover letter; and tracks every application
on a persistent pipeline board.

**Private by default.** The AI layer is provider-agnostic — the same code runs
against a local OpenAI-compatible model (LM Studio) or cloud providers
(OpenAI / Anthropic). Switch with one env var; nothing has to leave your machine.

## Stack

- **Next.js (App Router) + React 19 + TypeScript**
- **Tailwind CSS v4** with an oklch design-token system + Storybook
- Provider-agnostic **streaming AI layer** (local · OpenAI · Anthropic)
- Next API routes (Node) · Postgres (Neon/Supabase) for the pipeline
- Quality: Jest + React Testing Library, Playwright, ESLint, Prettier,
  Lighthouse CI (Core Web Vitals), GitHub Actions, Docker

## Getting started

```bash
pnpm install
cp .env.example .env.local   # configure your AI provider
pnpm dev                      # http://localhost:3000
```

## Scripts

| Script                                    | What it does             |
| ----------------------------------------- | ------------------------ |
| `pnpm dev`                                | Run the dev server       |
| `pnpm build` / `pnpm start`               | Production build / serve |
| `pnpm typecheck`                          | `tsc --noEmit`           |
| `pnpm lint`                               | ESLint                   |
| `pnpm format` / `pnpm format:check`       | Prettier write / check   |
| `pnpm test` / `pnpm test:coverage`        | Jest + RTL               |
| `pnpm e2e`                                | Playwright end-to-end    |
| `pnpm storybook` / `pnpm build-storybook` | Component workshop       |

## Build phases

- [x] **0 — Scaffold:** Next.js, Tailwind tokens, design system, Storybook, Jest, Playwright, CI, Docker
- [ ] **1 — AI provider layer:** streaming, provider-agnostic, typed I/O schemas
- [ ] **2 — JD analysis:** extract tech / seniority / archetype + fit + gaps
- [ ] **3 — Cover letter:** streaming draft, anti-slop
- [ ] **4 — Pipeline board:** CRUD + persistence + statuses
- [ ] **5 — Polish:** Core Web Vitals, a11y, ≥80% coverage, AWS deploy
