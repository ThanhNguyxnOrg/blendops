# Evidence Hook Rules — Acceptance Criteria

Every **P0 (blocking release/delivery)** acceptance criterion MUST bind to an explicit observable check rather than subjective confidence.

## Required Structure Per P0 Criterion
1. **Artifact / Signal Type** — Exact deliverable (`render.png`, `hero.glb`, `stderr`, `inspect-glb JSON`, screenshot).
2. **Minimum Truth State Target** — `Produced` (file exists on disk, non-zero size, valid format) vs `Verified` (observed visual/schema pass recorded under `docs/evals/` or ledger).
3. **Validator Owner** — Exact BlendOps checker (`render-export-evidence`, `pre-handoff-verification`, `polycount-budget-checker`, `blendops glb-inspect`) or named human reviewer sign-off.
4. **Fail-Closed Condition** — What concrete mismatch forces status back to `Failed` / `Not Produced`.

## Anti-Rationalization Rules (Forbidden Hooks)
- "Looks clean in code" or "Script ran without syntax errors" → **INVALID**. Headless Blender frequently exits `0` while producing black/blank renders or ungrounded geometry.
- "Assumed `Verified` because brief matched" → **INVALID**. Matching intent before execution hits `Runtime status: Not Run`, never `Verified`.
- Subjective aesthetic claim without side-by-side reference or human sign-off → Keep `Produced (Visual QA Pending)`.

Align exact status strings with `render-export-evidence` and `laws/evidence-before-done.md`.

## Related skill
- [SKILL.md](../SKILL.md)
