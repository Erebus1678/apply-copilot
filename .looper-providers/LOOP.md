# apply-copilot-providers

Make Apply Copilot fully provider-agnostic with token-saver compression; SaaS deferred.

## Goal

Make Apply Copilot provider-agnostic (local, OpenAI, Anthropic, OpenRouter, Groq, Together, Ollama), rework the provider toggler (BYO-key, model dropdown, health), add built-in prompt compression and an optional external compress proxy, and document every self-host setup.

## Definition of Done

All five deliveries implemented with small diffs following existing patterns, every gate green (typecheck, lint, test:coverage 80/70/78/80, build), each passed ECC review with no CRITICAL/HIGH, and each committed. SaaS and deploy are NOT part of done.

## Verification

- `typecheck` (programmatic)
- `lint` (programmatic)
- `tests` (programmatic)
- `build` (programmatic)
- `review` (judge)
- `feature-signoff` (human)

## Council

- `react-reviewer`: judge via claude (default)
- `code-reviewer`: judge via claude (default)

## Gates

- Plan gate: revise_until_clean
- Delivery gate: revise_until_clean

## Loop Control

- Max iterations: 8
- Budget: `{"wall_clock_min": 300}`
- No-progress: `{"action": "stop", "max_stalled_iterations": 2, "signals": ["same gate failure repeats with no material code change", "delivery has no committed diff", "reviewer findings unchanged after a revision"]}`

## Execution Boundary

- Mode: `in_session`
- Isolation: `current_workspace`
- Side effects: `{"duplicate_action_check": true, "requires_approval": true}`

## Observability

- State file: `state.json`
- Run log: `run-log.md`
- Checkpoint granularity: `gate`

## Flow Preview

```text
+--------------------------------+
| 1. Goal + context              |
| read sources                   |
+--------------------------------+
               |
               v
+--------------------------------+
| 2. Draft plan.md               |
| state -> state.json            |
+--------------------------------+
               |
               v
+--------------------------------+
| 3. Plan gate                   |
| verdict: code-reviewer         |
+--------------------------------+
               | needs work -> revise <= 2 -> step 2
               | pass
               v
+--------------------------------+
| 4. Write delivery-N.md         |
| log -> run-log.md              |
+--------------------------------+
               |
               v
+--------------------------------+
| 5. Delivery gate               |
| verdict: code-reviewer         |
+--------------------------------+
               | needs work -> revise <= 3 -> step 4
               | pass
               v
+--------------------------------+
| 6. Final output                |
| all gates clean                |
+--------------------------------+

Stops: pass gates | max 8 iterations | no progress x2 | budget 300m
```
