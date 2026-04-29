# Package Layout

Status: Draft v0

## Purpose

Define the relationship between:
- canonical source docs (`docs/`)
- installable root skill collection (`skills/`, `laws/`, `packs/`)

## Current layout model

- `docs/` = canonical research/spec/source-of-truth
- `skills/` = installable AI-agent skill units (multiple focused skills)
- `laws/` = shared guardrails used by all skills
- `packs/` = bundle manifests composing laws + skills

## Current root collection

```txt
skills/
  README.md
  official-runtime-setup-guide/
    SKILL.md
  official-runtime-readiness-checker/
    SKILL.md
  product-hero-scene-planner/
    SKILL.md
  blender-composition-camera-planner/
    SKILL.md
  blender-lighting-material-planner/
    SKILL.md
  blender-scene-quality-checker/
    SKILL.md
  glb-web-handoff/
    SKILL.md
  non-blender-user-response-writer/
    SKILL.md

laws/
  README.md
  official-runtime-only.md
  no-arbitrary-python-interface.md
  evidence-before-done.md
  non-blender-user-language.md

packs/
  README.md
  product-hero-v0/
    PACK.md
```

## Future install/adoption flow

- Agent install guide attaches root collection project-locally by default.
- Runtime setup remains external and official-reference-only.
- Future installers may copy these root collection files into tool-specific locations, but that is out of scope in v0.
- Multi-agent install planning is tracked in [multi-agent-install-strategy.md](./multi-agent-install-strategy.md).
- Distribution levels and marketplace caveats are tracked in [distribution-strategy.md](./distribution-strategy.md).

## Promotion criteria

Promote from draft only when:
- install dry-run in disposable fixture project passes
- rollback instructions are verified
- runtime eval findings are incorporated
- docs/ and root collection remain aligned

## Non-goals

- no runtime code installers
- no runtime ownership claims
- no global config mutation by default
- no Blender runtime install/run from pack files
