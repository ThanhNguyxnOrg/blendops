---
name: runtime-path-picker
description: Choose Path 1 Lab MCP, Path 2 ahujasid bridge, or CLI appendix from constraints; Connector hosts Path 1 only with Lab add-on inside Blender.
---

# runtime-path-picker

## Purpose

Produce a **single primary** runtime execution choice among Path 1 (Blender Lab MCP), Path 2 (community `ahujasid/blender-mcp`), or the CLI fallback appendix — with explicit tradeoffs and no false "standalone Connector" claims.

## Quick start

- collect Blender version band, host app (Claude Desktop vs coding agent vs CI), interactivity needs
- score against `references/path-constraints-table.md`
- walk `references/decision-tree.md`
- document choice using `references/anti-patterns.md` guardrails

## When to use

- user unsure Lab vs community vs CLI
- environment pinned to Blender below 5.1 (Path 1 unavailable)
- automation / batch render discussion

## When not to use

- port collision diagnostics → `runtime-bridge-conflict-resolver`
- detailed install steps → `official-runtime-setup-guide`
- readiness probing → `official-runtime-readiness-checker`

## Trigger phrases

- "which MCP should I use"
- "Lab MCP or ahujasid"
- "Path 1 or Path 2"
- "CLI vs MCP"

## Prerequisites / readiness

- target Blender major/minor known or explicitly unknown
- whether interactive steering vs batch matters

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Blender version (or uncertainty) | Gates Path 1 |
| Host environment category | Connector vs generic MCP vs CI |

### Optional inputs

| Input | Use |
|---|---|
| Org IT constraints | May force CLI appendix |
| Prior tooling investment | Path loyalty |

## Output schema

### Primary output

- primary path recommendation + rationale
- rejected paths + why
- host option note for Path 1: (a) Anthropic Blender Connector or (b) manual MCP client — **both** require Lab add-on inside Blender

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed | Blocked / Not Run
Artifact status: Not Run | Not Produced | Produced | Verified | Failed
Evidence used: <user-stated constraints only unless logs provided>
Limitations: <unknown Blender build>
```

## Required laws

- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

Decision skill only — does not configure hosts. Must reflect BlendOps model: **two MCP execution paths** plus **CLI fallback appendix** documented upstream as a **first-class** Blender CLI surface; **No in-repo evidence file yet** for BlendOps-run CLI examples. Path 2 is third-party community (`ahujasid/blender-mcp`) — mature prior art with manual configuration responsibility; see `docs/unofficial-runtime-bridges.md`. Never describe Anthropic Connector as replacing the Lab add-on inside Blender.

## Operating procedure

1. Gate Path 1 on Blender 5.1+ feasibility.
2. If Path 1 impossible and interactive MCP wanted → Path 2 if acceptable risk profile.
3. If batch / headless / CI → prefer CLI appendix plan (`cli-appendix-job-outline`).
4. Warn on Single-bridge constraint if multiple bridges detected.

## Mode handling

### Text-only mode

Hypothetical picks labeled clearly.

### Runtime-ready mode

Cross-check suggestions with readiness checker output if present.

### Blocked runtime mode

Still deliver decision table for future attempt.

## Validation checklist

- [ ] Primary path singular
- [ ] Connector not standalone assertion present when Path 1 + Connector mentioned
- [ ] Path 2 labeled community third-party when recommended
- [ ] CLI appendix framed per policy strings above when mentioned

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Coherent pick + constraints mapped |
| Warn | Missing Blender version — conditional branches explicit |
| Fail | Claims Connector alone suffices for Path 1 |

## Cross-skill handoff

- Setup detail → `../official-runtime-setup-guide/SKILL.md`
- Conflicts → `../runtime-bridge-conflict-resolver/SKILL.md`
- CLI shape → `../cli-appendix-job-outline/SKILL.md`
- Host specifics Path 1 → `../path-one-host-outline/SKILL.md`

## References

- `references/path-constraints-table.md`
- `references/decision-tree.md`
- `references/anti-patterns.md`
- `../../docs/runtime-stack-strategy.md`
