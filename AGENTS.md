# CommonGround Phase 1 Stabilization

MISSION
Make Phase 1 green by running the single pipeline command and fixing failures until it passes.

ONE COMMAND (source of truth)
npm run check

SCOPE RULES
- No new features.
- No intentional product behavior changes.
- Minimal diffs only.
- Fix only: lint/type/build/test/config/deps issues that block `npm run check`.

PROCESS
1) Run `npm run check`.
2) Categorize failures (lint, type, build).
3) Fix the smallest root cause.
4) Re-run `npm run check`.
5) Repeat until it passes.

DO NOT
- Do not delete tests to pass checks.
- Do not broadly disable lint rules.
- Do not introduce new telemetry, data collection, or persistence.

DELIVERABLES
- List failures found.
- Files changed with short justification.
- Final confirmation that `npm run check` passes.
