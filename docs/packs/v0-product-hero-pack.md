# Pack: v0-product-hero-pack

Status: Draft v0

## Included laws

- [../laws/official-runtime-only.md](../laws/official-runtime-only.md)
- [../laws/no-arbitrary-python-interface.md](../laws/no-arbitrary-python-interface.md)
- [../laws/evidence-before-done.md](../laws/evidence-before-done.md)
- [../laws/non-blender-user-language.md](../laws/non-blender-user-language.md)

## Included skills

- [../skills/official-runtime-setup-guide.md](../skills/official-runtime-setup-guide.md)
- [../skills/product-hero-scene-planner.md](../skills/product-hero-scene-planner.md)
- [../skills/blender-scene-quality-checker.md](../skills/blender-scene-quality-checker.md)
- [../skills/glb-web-handoff.md](../skills/glb-web-handoff.md)
- [../skills/non-blender-user-response-writer.md](../skills/non-blender-user-response-writer.md)

## Included workflow

- [../workflows/product-hero-workflow.md](../workflows/product-hero-workflow.md)

## Included recipe

- [../recipes/cyberpunk-shoe-hero.md](../recipes/cyberpunk-shoe-hero.md)

## Activation/use cases

- non-Blender-user product hero requests
- web-oriented GLB handoff expectations
- quality-gated output reporting

## Compatibility notes

- Runtime strategy is official-only in active docs.
- BlendOps remains runtime-light and does not ship runtime implementations.
- Source confidence should be marked (`verified-read` / `linked-only`) for official runtime pages.

## Non-goals

- no runtime code implementation
- no plugin packaging/installer generation
- no custom CLI/MCP/addon ownership

## Release criteria

- all included docs exist and cross-link correctly
- no active non-official runtime setup references
- verification checks pass

## Verification expectations

- pass/warn/fail taxonomy used across workflow and recipe outputs
- evidence/caveat sections present in user-facing results
- runtime confidence labels present where required
