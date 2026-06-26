# Run log — apply-copilot-oss-lan

| iter | delivery | gates | review | commit | notes |
|------|----------|-------|--------|--------|-------|
| 1 | pglite-db | typecheck/lint/test(131)/build green + PGlite runtime smoke (migration+CRUD) | code: CRITICAL(migrations in standalone) + HIGH(cache) FIXED; MED/LOW accepted | 3daef74 | embedded PGlite default, DATABASE_URL optional, Docker copies drizzle |
| 2 | custom-provider | typecheck/lint/test(132)/build green | self-attested (1 registry row, shape-identical to 7 reviewed providers) | b0367e8 | 9Router provider (localhost:20128/v1), keyless, env-overridable |
| 3 | local-profiles | typecheck/lint/test(141)/build green + 3 PGlite smokes | react: APPROVE 0; code: HIGH(ensureDefault race) FIXED w/ advisory lock, 2 MED accepted | aa54e93 | profiles table + switcher + board/stats scoped by profile_id |
| 4 | import-tracking | typecheck/lint/test(150)/build green | code: HIGH(FK→500) FIXED→400; react: HIGH(stale profileId mid-import) FIXED w/ ref; MEDs accepted | 11f3f5d | CSV/JSON importer → active profile; POST /api/applications/import (1..500, bulk insert) |
| 5a | lan-oss-docs (zero-config + LAN) | typecheck/lint/test(150) green + compose config -q OK | self-attested (config+docs; compose validated) | 95e9aaf | docker compose → embedded PGlite (no db svc / no migrate), 0.0.0.0 LAN, dev:lan, README rewrite |
| 5b | lan-oss-docs (OSS packaging) | typecheck/lint/test(150)/format:check green | self-attested (docs/templates) | 8f30f32 | CONTRIBUTING + CHANGELOG + EDITIONS + issue/PR templates; .prettierignore fixes pre-existing red format:check |
