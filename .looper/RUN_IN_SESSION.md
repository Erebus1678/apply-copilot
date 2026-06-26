# Run `apply-copilot-backlog` In This Session

Use this prompt when the user wants to run the Looper-designed loop in the current LLM session.
This is the default/easy execution path. The Python runner is the advanced path for running later or outside the session.

## Operator Instructions

You are executing a Looper-designed loop in this current session.
Follow the resolved spec below, write handoff files into the workspace, and enforce the caps manually.
Do not use `run-loop.py` unless the user explicitly asks for the advanced external runner.

1. Create the workspace directory if it does not exist.
2. Read the context sources before drafting the plan.
3. Draft `plan.md` in the workspace.
4. Run the plan gate. Apply programmatic checks when available. For judge criteria, use the configured judge only after consent for any non-local egress; otherwise ask the user to approve a human/current-session substitute.
5. Revise until the gate passes or `max_revisions` is reached.
6. Produce `delivery-N.md` in the workspace.
7. Run the delivery gate after each delivery.
8. Stop when all delivery criteria pass, a cap is reached, or the user stops the loop.
9. Keep `state.json` current with status, iteration, last gate, consent, and blockers.
10. Append a compact entry to `run-log.md` after every context read, model call, check, gate verdict, revision, blocker, and stop decision.
11. Compare each blocker against the previous blocker. If the same blocker repeats for the configured no-progress window, stop or ask for the configured human checkpoint instead of revising again.
12. Treat token and USD budgets as operator limits in this session: if exact accounting is unavailable, stop and ask before continuing when the loop appears likely to exceed them.

## Files

- Source spec: `loop.yaml`
- Human summary: `LOOP.md`
- Resolved spec: `loop.resolved.json`
- Workspace: `./loop-workspace`
- State file: `state.json`
- Run log: `run-log.md`

## Goal

Ship the Apply Copilot feature backlog one feature per iteration, in order (cv-upload, cv-quality-check, statistics, ai-text-postprocess, design-polish, self-host), each behind the same quality gate used for phases 0-5. Deploy is explicitly out of scope and handled separately, last.

## Definition Of Done

All six backlog features are implemented with small diffs that follow existing patterns, every gate is green (typecheck, lint, test:coverage at 80/70/78/80, build), each passed ECC review with no CRITICAL/HIGH, and each feature is committed. Deploy is NOT part of done.

## Context Sources

- Read file `E:\projects\apply-copilot`
- Read file `C:\Users\furym\.claude\projects\E--projects\memory\apply-copilot-build.md`

## Verification Criteria

- `typecheck` programmatic: run `["pnpm", "typecheck"]` and expect `exit_zero`
- `lint` programmatic: run `["pnpm", "lint"]` and expect `exit_zero`
- `tests` programmatic: run `["pnpm", "test:coverage"]` and expect `exit_zero`
- `build` programmatic: run `["pnpm", "build"]` and expect `exit_zero`
- `review` judge rubric: The feature follows existing codebase patterns, validates input at trust boundaries, handles errors, and introduces no CRITICAL or HIGH issues (security, correctness, React hook/render, accessibility).

- `feature-signoff` human signoff: Feature committed and gates green — OK to proceed to the next backlog feature?

## Council

- `react-reviewer` judge via `["claude", "-p"]` (local; timeout 600s)
- `code-reviewer` judge via `["claude", "-p"]` (local; timeout 600s)

## Gates

### plan_gate

- When: `after_plan`
- Policy: `revise_until_clean`
- Verdict source: `code-reviewer`
- Criteria: `review`
- Max revisions: `2`

### delivery_gate

- When: `after_each_delivery`
- Policy: `revise_until_clean`
- Verdict source: `code-reviewer`
- Criteria: `typecheck, lint, tests, build, review`
- Max revisions: `3`

## Loop Control

- Max iterations: `8`
- Budget: `{"wall_clock_min": 240}`
- No-progress: `{"action": "stop", "max_stalled_iterations": 2, "signals": ["same gate failure repeats with no material code change", "delivery has no committed diff", "reviewer findings unchanged after a revision"]}`
- Human checkpoints: `confirm before starting each feature beyond the first, confirm after each feature commit before moving on`
- Stop conditions:
  - all six backlog features pass their gate clean and are committed
  - max_iterations reached
  - same blocker repeats for 2 iterations
  - wall_clock budget exceeded

## Execution Boundary

- Mode: `in_session`
- Isolation: `current_workspace`
- Side effects: `{"duplicate_action_check": true, "requires_approval": true}`

If the loop needs scheduled runs, child-agent lifecycle management, concurrency control, or restart-safe step retries, stop and tell the user this Looper spec should be handed to a durable orchestrator.

## Observability

- State file: `state.json`
- Run log: `run-log.md`
- Checkpoint granularity: `gate`

Use `state.json` for the latest resumable status and `run-log.md` for the append-only history of what happened.

## Privacy

- No cross-vendor egress configured.

## Start Now

If the user asked to run now, begin at step 1 under Operator Instructions and keep going until a stop condition is reached.
