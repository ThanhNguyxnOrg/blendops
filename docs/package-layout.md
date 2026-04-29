# Package Layout (Planned)

Status: Draft v0

This document defines the **eventual** packaged layout for BlendOps adoption.

BlendOps remains a workflow/skill-pack layer and does not include runtime installer code in this phase.

```txt
blendops/
  README.md
  docs/
  skills/
    blendops/
      SKILL.md
      laws/
      skills/
      workflows/
      recipes/
      references/
  installers/
    README.md
  examples/
    install-prompts/
```

## Notes

- `docs/` is the source-of-truth design/spec layer.
- `skills/blendops/` is an eventual packaged projection for agent/tool attachment.
- `installers/` is documentation-only in v0 (no destructive/global-mutation scripts).
- `examples/install-prompts/` holds copy/paste prompts for human-triggered agent install flows.

## Non-goals in this phase

- no npm package publishing
- no runtime code installers
- no Blender runtime setup automation
- no global config mutation without explicit user approval
