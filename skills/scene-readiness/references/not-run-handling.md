# Not Run Handling

## Purpose
Prevent false `Ready` or `Verified` handoff claims whenever Blender execution did not run (`Runtime status: Not Run`), while still giving honest feedback on planning completeness.

## When to use
- In text-only / planning-only reviews, dry-run validations, or when runtime setup is blocked before scene execution.

## Mandatory Rules When Runtime Did Not Execute
1. **Separate Plan Quality from Runtime Proof**: You may grade *planning completeness* (`Scene plan complete`, `Camera & budget targets defined`), **never** *visual render quality* or *exported binary integrity*.
2. **Enforce Canonical Truth Labels**:
   - Always record **`Runtime status: Not Run`** (or `Failed` / `Attempted` if a real attempt occurred).
   - Always record **`Artifact status: Not Produced`** (NEVER write `Artifact status: Not Run` — `Not Produced` is the canonical artifact state when no file was generated on disk).
3. **Never Pre-Approve Visual Aesthetics**: Do not say `"lighting looks photoreal"` or `"GLB loads fast in Three.js"` before a real preview image or `.glb` file exists and is inspected.
4. **Provide the Single Next Unlock Action**: Name which path (`Path 1`, `Path 2`, or `CLI fallback`) or doc (`docs/evals/official-runtime-manual-eval-packet.md`) unlocks execution next.

## Good vs. Bad Output Snippets
- **Good**: `"Planning readiness: Strong (scene, camera, and tier-2 web material specs are complete). Runtime status: Not Run — Blender did not execute in this pass. Artifact status: Not Produced (no render PNG or .glb exists on disk). Next: connect Path 1 Lab MCP or run CLI fallback, then validate with pre-handoff-verification."`
- **Bad**: `"Scene ready for web deployment!"` or `"Artifact status: Not Run — export ready"` (violates truth-state discipline and misleads non-Blender users).

## Related skill
[../SKILL.md](../SKILL.md)
