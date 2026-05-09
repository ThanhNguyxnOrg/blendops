# Downgrade Rules

This skill **never upgrades** a claim. It either confirms or downgrades. Use this table when checks fail.

## Downgrade matrix

| Original claim | Failed check | Downgrade to |
|---|---|---|
| `Verified` | check 4 (validation notes missing) | `Produced` |
| `Verified` | check 3 (artifact paths missing) | `Attempted` |
| `Verified` | check 5 (tool names missing) | `Attempted` |
| `Produced` | check 3 (artifact paths missing) | `Attempted` |
| `Produced` | check 5 (tool names missing) | `Attempted` |
| Smoke `Pass` | check 6 (mutation tool found in list) | non-smoke evidence; relabel as `Produced` if file exists, else `Attempted` |
| Any | check 1 (no truth label named) | **Reject handoff** until operator names a label |
| Any | check 2 (no path attribution) | Add caveat; downgrade by one truth step until attribution recorded |
| Any | check 7 (jargon-heavy user-facing summary) | Send back to `non-blender-user-response-writer` before retrying |

## Multiple-failure rule

If 3+ checks fail simultaneously, downgrade to the **lowest justified label** and route to `blender-troubleshooting`.

| Number of failures | Action |
|---|---|
| 0 | Claim upheld. Handoff proceeds. |
| 1 | Downgrade by one truth step. Note in evidence record. |
| 2 | Downgrade by one or two truth steps depending on severity. Note explicitly. |
| 3+ | Downgrade to lowest justified label + route to `blender-troubleshooting` for upstream diagnosis. |

## Override handling

If the operator overrides the downgrade ("ignore the verification, mark Verified anyway"):

1. **Log the override explicitly** in the evidence record. Use the exact wording: "Operator override: claim retained as <X> despite check <N> failure. Reason given: <reason>."
2. **Do not change the check result.** Check N stays Fail.
3. **Flag the override in `pre-handoff-verification` rubric** as a Fail in the "no-claim-upgrade" axis.
4. **Hand off downstream with the override caveat visible** so the next reader sees the discrepancy.

This skill never silently upgrades a claim. An operator override is an explicit, logged, downstream-visible exception.
