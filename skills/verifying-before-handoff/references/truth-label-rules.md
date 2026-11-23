# Truth label rules (per laws/evidence-before-done.md)

## The five labels

| Label | When to use |
|---|---|
| `Not Run` | The action was not attempted. |
| `Attempted` | The action was attempted but did not produce a verifiable artifact. |
| `Produced` | An artifact exists at a known path; not yet validated against the planned spec. |
| `Verified` | An artifact exists AND a validation check passes (e.g. dimensions, file integrity, visual diff, gltf-validator). |
| `Failed` | The action was attempted and produced an error or unusable artifact. |

## Upgrade rules

- `Not Run → Attempted`: only when an attempt happened.
- `Attempted → Produced`: only when a file exists at a known path.
- `Produced → Verified`: only when a validation check name + result is recorded.
- Never upgrade past `Verified` (no "double verified" or "stable" in this dimension).
- Never downgrade silently; downgrades require a recorded reason.

## Common mistakes

- Calling a render `Verified` because it "looks fine". Verification needs an explicit check.
- Calling a GLB `Produced` without a path on disk.
- Calling a step `Failed` without recording the error.

## When validation is partial

Stay at `Produced`; add a note like "validation: dimensions match; gltf-validator skipped".

## When the artifact came from a different path

If the report records a Path 1 host b run but the artifact came from a Path 2 run, the row is `Failed` with a note about the path mismatch (single-bridge constraint forbids merging).

## Related skill
`../SKILL.md`
