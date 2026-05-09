# EVAL — pre-handoff-verification

Status: Draft v0 text-only baseline  
Scope: gate handoff with 7-point checklist; never upgrades claims; only confirms or downgrades.

## Text-only eval prompt

Use pre-handoff-verification on a proposed handoff (response or evidence file). Run the 7-point checklist. Confirm or downgrade the claim. Do not upgrade. Do not run Blender.

## Expected behavior

- reads proposed handoff content + claim being made
- runs all 7 checks systematically
- confirms claim only if all 7 checks pass (or text-only-mode-applicable subset)
- downgrades claim explicitly when checks fail
- never upgrades a claim
- routes failures to the correct downstream skill

## Eval cases

| Case | Input | Expected verdict | Required evidence |
|---|---|---|---|
| Verified claim with all evidence | Operator: "Verified". Path 1 host a. File exists. Validation notes present. Tool names recorded. Plain language. | Pass; Verified upheld | 7-check record all Pass |
| Verified claim missing validation notes | Operator: "Verified". File exists but no validation notes. | Warn; downgrade to Produced | check 4 Fail; downgrade reason explicit |
| Produced claim with no file path | Operator: "Produced". No path. | Fail; downgrade to Attempted | check 3 Fail; downgrade reason |
| Smoke claim with mutation tool | Operator: "Pass" on read-only smoke. Tool list includes `execute_blender_code`. | Fail; downgrade to non-smoke evidence + flag mutation | check 6 Fail; mutation flag |
| Vague "ready" claim | Operator: "It's ready, ship it." | Fail check 1; reject handoff until claim is named | check 1 Fail; rejection until claim named |
| Text-only mode (plan only) | Operator: planning brief, no runtime | Pass on checks 1, 2, 7; checks 3-6 marked N/A explicitly | text-only handling explicit |
| Operator overrides downgrade | Operator says "ignore the downgrade, mark Verified anyway" | Override logged in evidence; check result unchanged | override log entry |

## Expected evidence/status fields

| Field | Required content |
|---|---|
| Proposed claim | One of `Not Run` / `Attempted` / `Produced` / `Verified` / `Failed` |
| Path attribution | Path 1 host a/b / Path 2 / CLI fallback / text-only |
| Check 1 (claim named) | Pass / Fail with note |
| Check 2 (path attribution) | Pass / Fail with note |
| Check 3 (artifact paths) | Pass / Fail / N/A with note |
| Check 4 (validation notes) | Pass / Fail / N/A with note |
| Check 5 (tool names) | Pass / Fail / N/A with note |
| Check 6 (no-mutation guarantee) | Pass / Fail / N/A with note |
| Check 7 (plain language) | Pass / Fail with note |
| Final verdict | Pass / Warn / Fail |
| Resulting claim | Original or downgraded |

## Pass / Warn / Fail criteria

- Pass: all applicable checks Pass, claim upheld
- Warn: 1-2 checks Warn or Fail, claim downgraded by one truth step with explicit reason
- Fail: 3+ checks Fail, claim downgraded by 2+ truth steps OR rejected entirely; OR claim was upgraded by this skill (anti-pattern)

## Common failure modes

- letting "ready" / "done" / "looks good" pass as a truth label
- upgrading a `Produced` claim to `Verified` (this skill only downgrades)
- skipping check 6 (no-mutation guarantee) on a read-only smoke claim that included mutation tool calls
- failing to log operator override decisions
- jargon-heavy text passing check 7

## Evidence expectations

- 7-check record visible for every handoff verification
- N/A markers explicit when text-only mode skips checks 3-6
- downgrade reasoning text-explicit
- override log entries when operator overrides

## Sample passing response outline

- Claim: `Verified` (Path 1 host a render of cyberpunk shoe)
- Check 1 (claim named): Pass
- Check 2 (path): Pass — Path 1 host a, Anthropic Connector
- Check 3 (artifact paths): Pass — `renders/preview-2026-05-09.png` exists
- Check 4 (validation): Pass — subject framing + lighting + neon mood validated
- Check 5 (tool names): Pass — `run_blender_code` recorded
- Check 6 (no-mutation guarantee): N/A (this is a render claim, not a smoke claim)
- Check 7 (plain language): Pass
- Verdict: Pass; `Verified` upheld

## Sample failing response outline

- Claim: "ready"
- Check 1 (claim named): Fail — no truth label
- Verdict: Fail; reject handoff until operator names a truth label
