# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims to
follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Zero-config self-host** — embedded PGlite database by default (a local file,
  auto-migrated on first boot). `DATABASE_URL` is now optional; set it only to use
  a shared Postgres. `docker compose up` needs no setup and no migration step.
- **LAN sharing** — the server binds `0.0.0.0`; open `http://<lan-ip>:3000` from
  any device and pick a profile. Added a `dev:lan` script.
- **Local profiles** — per-person cabinets (no auth). Applications are scoped by
  profile via the header switcher; a default profile is created on first run.
- **Import job tracking** — bring an existing tracker in from CSV or JSON; rows
  are validated and imported into the active profile, with invalid rows skipped
  and reported (`POST /api/applications/import`).
- **Provider-agnostic AI layer** — local (LM Studio), Ollama, OpenAI, Anthropic,
  OpenRouter, Groq, Together, and **9Router**. Choose a provider in the header,
  bring your own key + model per device, and see each provider's health.
- **Token savers** — always-on built-in prompt compression, plus an opt-in
  external compress proxy (`COMPRESS_PROXY_URL`).
- **CV tools** — upload a CV (PDF/DOCX) and run a quality check; statistics view
  over the pipeline.
- **Open-source packaging** — `CONTRIBUTING.md`, issue/PR templates, this
  changelog, and [EDITIONS.md](EDITIONS.md) (OSS vs SaaS, one codebase, env-gated).

### Core

- JD analysis (tech stack / seniority / archetype + fit + gaps, structured
  streaming), streaming cover-letter drafting, and a persistent pipeline board
  (CRUD + statuses).
- Quality gates: Jest + React Testing Library (≥80% coverage on app logic),
  Playwright E2E, ESLint, Prettier, Lighthouse CI (Core Web Vitals), GitHub
  Actions, Docker. Accessibility checked with `jest-axe`. AI endpoints are
  IP-rate-limited.
