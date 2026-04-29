# BlendOps Root Entrypoint Template

Use this content as project-root `BLENDOPS.md` when applying generic-root fallback.

---

# BLENDOPS

## What BlendOps is

BlendOps is an AI-native Blender workflow/law/skill collection for non-Blender users.

## Official runtime boundary

- Official Blender MCP Server
- Official Claude Blender Connector
- Official Blender CLI docs

BlendOps does not install or run Blender runtime.

## Active laws

- official-runtime-only
- no-arbitrary-python-interface
- evidence-before-done
- non-blender-user-language

## Skill collection map

See:
- `skills/README.md`
- `laws/README.md`
- `packs/README.md`

## Product hero pack

Primary pack:
- `packs/product-hero-v0/PACK.md`

## First-use prompt

Use the product-hero-v0 pack to plan a cyberpunk shoe web hero. Do not run Blender until runtime is explicitly available. Do not claim preview/render/GLB exists without evidence.

## Artifact truth policy

Always label artifact status as:
- Produced
- Not Produced
- Not Run

## Runtime unavailable behavior

If runtime is blocked/unavailable:
- proceed in planning mode
- record blockers and next actions
- do not claim runtime execution success

## Source docs

- `docs/external-runtime-setup.md`
- `docs/reference-runtime.md`
- `docs/install-strategy.md`
