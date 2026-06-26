# Editions: Open Source vs SaaS

Apply Copilot ships as **one codebase** with two editions. The hosted (SaaS)
edition is the open-source edition **plus** a thin, env-gated layer — never a
fork. This document is the decision record for how that split works, so the OSS
edition stays first-class and self-hostable forever.

## TL;DR

|                    | **OSS edition** (this repo)              | **SaaS edition** (future)                          |
| ------------------ | ---------------------------------------- | -------------------------------------------------- |
| Hosting            | Self-hosted (your machine / LAN / a box) | Operator-hosted                                    |
| Database           | Embedded **PGlite**, zero setup          | Shared **Postgres** (`DATABASE_URL`)               |
| Identity           | **Local profiles**, no auth              | Authenticated **accounts**                         |
| AI keys            | Bring your own (per device) or local     | Operator-funded (server-held key, e.g. OpenRouter) |
| Billing / metering | None                                     | Added in the SaaS layer                            |
| Cost               | Free                                     | Paid (you pay for zero-setup convenience)          |

The OSS edition is fully usable on its own. The SaaS edition exists so people who
don't want to run anything can pay the operator to host it and fund the tokens.

## The seams that make it one codebase

The OSS edition was built so the SaaS layer slots in by **configuration**, not by
editing the core. Three seams already exist today:

### 1. Database driver — `DATABASE_URL`

`src/db/client.ts` is a dual driver:

- **unset** → embedded PGlite (a local file, auto-migrated on boot). OSS default.
- **set** → Postgres via `postgres.js`. SaaS uses this for a shared, durable DB.

No code change to switch — just the env var. Same Drizzle schema either way.

### 2. Tenancy — the `profileId` column

Applications are scoped by `profiles.id` (`src/db/schema.ts`,
`applications.profile_id`). In the OSS edition a "profile" is a local cabinet you
pick from the header (no auth). In the SaaS edition the **same column** maps to an
authenticated user/tenant — the data model doesn't change, only how `profileId`
is resolved (from a session instead of a header dropdown).

### 3. AI keys — server-side per-provider keys + compress hook

`getModel()` already reads a server-side key per provider from env, and accepts a
per-request override (BYO key). For SaaS the operator sets one funded key (e.g.
`OPENROUTER_API_KEY`) and **disables** the BYO override; the existing
`COMPRESS_PROXY_URL` hook caps token cost. The plumbing is the same.

## What the SaaS layer adds (and where)

Everything below is **additive** and gated by env (e.g. `APP_EDITION=saas`):

- **Auth** — wrap routes/pages with a session check; resolve `profileId` from the
  authenticated user instead of the header store.
- **Billing & metering** — a usage table + a billing provider (e.g. Stripe);
  middleware that counts requests/tokens per tenant.
- **Server-held keys** — force the operator key, ignore BYO overrides.
- **Limits** — per-plan rate limits layered on the existing IP rate limiter.

None of these require touching the OSS feature code. A self-hoster never installs
them, and the OSS edition never depends on them.

## Principle

> If a change would force the OSS edition to be forked to stay self-hostable,
> it's the wrong change. Add an env-gated seam instead.

This keeps the project honest: the thing you self-host is the same thing the SaaS
runs, minus the paid convenience layer.
