# Apply Copilot

![CI](https://img.shields.io/badge/CI-typecheck%20·%20lint%20·%20tests%20·%20build-2563eb)
![Core Web Vitals](https://img.shields.io/badge/Core%20Web%20Vitals-Lighthouse%20CI-22c55e)
![Coverage](https://img.shields.io/badge/coverage-%E2%89%A580%25-22c55e)

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

## Quality & performance

- **Accessibility** — components are checked with `jest-axe`; Lighthouse CI gates the a11y score at ≥ 0.9.
- **Core Web Vitals** — Lighthouse CI runs on every push (`lighthouserc.json`) and watches LCP ≤ 2.5s, CLS ≤ 0.1, TBT ≤ 200ms, FCP ≤ 1.5s.
- **Coverage** — Jest enforces ≥ 80% statements/lines on application logic (integration boundaries are covered by Playwright + live checks).
- **Rate limiting** — the AI endpoints are IP-rate-limited (in-memory, 20 req/min).

## Build phases

- [x] **0 — Scaffold:** Next.js, Tailwind tokens, design system, Storybook, Jest, Playwright, CI, Docker
- [x] **1 — AI provider layer:** streaming, provider-agnostic (local / OpenAI / Anthropic), typed I/O schemas
- [x] **2 — JD analysis:** extract tech / seniority / archetype + fit + gaps (structured streaming)
- [x] **3 — Cover letter:** streaming draft, anti-slop
- [x] **4 — Pipeline board:** CRUD + Postgres persistence + statuses
- [~] **5 — Polish:** provider-switch UI ✓ · design system ✓ · a11y (axe) ✓ · ≥80% coverage ✓ · Lighthouse CI ✓ · rate limiting ✓ — deploy + demo remaining
