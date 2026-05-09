# `Attempted` vs `Failed` Rubric

These two labels are commonly confused. They are not synonyms.

## Definitions

| Label | Meaning |
|---|---|
| `Attempted` | Runtime action was started; **outcome is unknown or evidence is incomplete**. The action might have succeeded, failed, or been interrupted — we don't have enough evidence to say. |
| `Failed` | Runtime action was started; **we have evidence it did not meet stated criteria**. The failure is observed, not assumed. |

## Decision rule

```
Was a runtime action attempted?
NO  → `Not Run`
YES → Did we OBSERVE evidence of the outcome?
      NO  → `Attempted` (unknown outcome)
      YES → Did the observed outcome match the stated criteria?
            YES → `Produced` or `Verified` (depending on validation)
            NO  → `Failed`
```

## Examples

### Example 1 — `Attempted` (correct)

> Operator ran `blender --background --python script.py`. The terminal session was killed before completion. No output file exists. No exit code captured. Stdout truncated.

→ Outcome unknown. Label = `Attempted`. We don't know if it would have succeeded.

### Example 2 — `Failed` (correct)

> Operator ran `blender --background --python script.py`. Exit code = 1. Stderr shows `ImportError: bpy module not found`. No output file.

→ Outcome observed and confirmed not-success. Label = `Failed`.

### Example 3 — Common mistake

> Operator ran a render. The system became unresponsive for 10 minutes. Operator gave up and force-quit. No output file.

| ❌ Wrong | ✅ Correct |
|---|---|
| `Failed` (because nothing came out) | `Attempted` (force-quit ≠ observed failure; the render might have been close to completing) |

The honest label depends on **what the operator actually saw**, not on what the operator assumes.

### Example 4 — `Failed` after partial success

> Render completed and `preview.png` exists at 1920×1080. Validation: subject is centered (Pass), mood is wrong (Fail — should be cyberpunk neon, but rendered with default lighting).

→ Output exists but validation failed. Label = `Failed`. (Not `Produced`, because validation notes were recorded and they fail the acceptance criteria.)

### Example 5 — `Produced` after partial validation

> Render completed and `preview.png` exists. Operator did not run the validation checklist yet.

→ Output exists, no validation. Label = `Produced`. Move to `Verified` only after validation runs and passes.

## Anti-patterns

| ❌ Don't | ✅ Do |
|---|---|
| Default to `Failed` because output is missing | Use `Attempted` if outcome is unknown; `Failed` only with observed evidence |
| Use `Failed` interchangeably with `Not Run` | `Not Run` = no attempt happened; `Failed` = attempt happened and observed not-success |
| Mark `Produced` when validation already failed | If validation notes exist and they fail, label is `Failed`, not `Produced` |
| Re-run forever to escape `Attempted` | Sometimes evidence is genuinely lost; `Attempted` is a valid honest label |

## Routing

If you find yourself stuck choosing between `Attempted` and `Failed`:

1. Check `pre-handoff-verification` 7-point gate first. The gate may downgrade `Failed` to `Attempted` if check 3 (artifact paths exist) fails.
2. If the truth genuinely is unknown, prefer `Attempted` — it is the more conservative label and respects `evidence-before-done` law.
3. Run `blender-troubleshooting` Phase 1 to determine if the symptom is reproducible. Reproducibility evidence helps choose between the two labels.
