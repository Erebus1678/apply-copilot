# Apply Copilot

![CI](https://img.shields.io/badge/CI-typecheck%20·%20lint%20·%20tests%20·%20build-2563eb)
![Core Web Vitals](https://img.shields.io/badge/Core%20Web%20Vitals-Lighthouse%20CI-22c55e)
![Coverage](https://img.shields.io/badge/coverage-%E2%89%A580%25-22c55e)

An AI copilot for job applications. Paste a job description and it extracts the
tech stack, seniority, and role archetype; scores the fit against your CV with a
concrete gap list; drafts a tailored cover letter; and tracks every application
on a persistent pipeline board.

**Private by default.** The AI layer is provider-agnostic — the same code runs
against a local model (LM Studio, Ollama) or any cloud provider (OpenAI,
Anthropic, OpenRouter, Groq, Together). Switch in the header, bring your own key
and model per device, and see each provider's health at a glance. Nothing has to
leave your machine — and built-in prompt compression trims input tokens on every
request.

## Stack

- **Next.js (App Router) + React 19 + TypeScript**
- **Tailwind CSS v4** with an oklch design-token system + Storybook
- Provider-agnostic **streaming AI layer** (local · Ollama · OpenAI · Anthropic ·
  OpenRouter · Groq · Together) with BYO-key + token-saver compression
- Next API routes (Node) · Postgres (Neon/Supabase) for the pipeline
- Quality: Jest + React Testing Library, Playwright, ESLint, Prettier,
  Lighthouse CI (Core Web Vitals), GitHub Actions, Docker

## Getting started

```bash
pnpm install
cp .env.example .env.local   # configure your AI provider
pnpm dev                      # http://localhost:3000
```

## Providers

Pick a default with `AI_PROVIDER` and configure only the one(s) you use. Every
provider can also be selected per session in the header, where you can paste a
**bring-your-own key** and pick a **model** (both stored on your device only). A
status dot shows whether each provider is reachable (local) or has a key (cloud).

| Provider   | `AI_PROVIDER` | Key env             | Base URL env / default                       | Model env / default |
| ---------- | ------------- | ------------------- | -------------------------------------------- | ------------------- |
| LM Studio  | `local`       | — (none)            | `LOCAL_AI_BASE_URL` · `http://localhost:1234/v1` | `LOCAL_AI_MODEL` · `qwen/qwen3-coder-30b` |
| Ollama     | `ollama`      | — (none)            | `OLLAMA_BASE_URL` · `http://localhost:11434/v1`  | `OLLAMA_MODEL` · `llama3.1` |
| OpenAI     | `openai`      | `OPENAI_API_KEY`    | official                                     | `OPENAI_MODEL` · `gpt-4o-mini` |
| Anthropic  | `anthropic`   | `ANTHROPIC_API_KEY` | official                                     | `ANTHROPIC_MODEL` · `claude-sonnet-4-6` |
| OpenRouter | `openrouter`  | `OPENROUTER_API_KEY`| `https://openrouter.ai/api/v1`               | `OPENROUTER_MODEL` · `openai/gpt-4o-mini` |
| Groq       | `groq`        | `GROQ_API_KEY`      | `https://api.groq.com/openai/v1`             | `GROQ_MODEL` · `llama-3.3-70b-versatile` |
| Together   | `together`    | `TOGETHER_API_KEY`  | `https://api.together.xyz/v1`                | `TOGETHER_MODEL` · `meta-llama/Llama-3.3-70B-Instruct-Turbo` |

Every provider except Anthropic is OpenAI-compatible — add another by appending a
row to `src/lib/ai/providers.ts`. For LM Studio / Ollama, the model id must match
what the server reports (e.g. LM Studio needs the org prefix `qwen/...`).

## Token savers

- **Built-in compression** (always on) — `src/lib/ai/compress.ts` trims the JD/CV
  prose (whitespace, blank runs, separator/duplicate lines) before every request,
  cutting input tokens with no meaning change. The analyze/cover-letter views show
  the estimated saving as you type.
- **External compress proxy** (opt-in) — set `COMPRESS_PROXY_URL` to route prompt
  text through a Headroom-style `/v1/compress` proxy (`{ text } -> { text }`,
  optional `COMPRESS_PROXY_TOKEN` bearer) before provider routing. Off by default;
  any failure or timeout falls back to the original prompt. **Note:** this sends
  prompt text off the box — opt-in egress.

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

## Self-hosting

Run the whole thing on your own machine — app plus Postgres — with Docker:

```bash
cp .env.example .env          # pick AI_PROVIDER; DB urls are wired in compose
docker compose up -d --build  # app on :3000, Postgres on :5432
pnpm install && pnpm db:migrate   # one-time, from the host
# open http://localhost:3000
```

By default the AI runs against an [LM Studio](https://lmstudio.ai) server on the host
(`http://host.docker.internal:1234/v1`) — nothing leaves your machine. To use a cloud
model instead, set `AI_PROVIDER` and the matching key in `.env`. The image is a
multi-stage build of Next.js standalone output (`Dockerfile`).

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

## SaaS (future)

The provider-agnostic core is deliberately a foundation for a hosted offering:
one operator funds tokens (e.g. via an OpenRouter key) and users pay for a
zero-setup experience. That layer — auth, billing, usage metering, and
server-held keys — is a **separate epic**, intentionally out of scope here. The
current code already supports the building blocks: a server-side key per provider
(env) today, swappable for per-tenant keys later, plus the compress proxy hook to
cap token cost. Self-hosting stays first-class either way.

## License

[MIT](LICENSE) © 2026 Dmytro
