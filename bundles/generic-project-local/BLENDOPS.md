# BLENDOPS

Status: Draft v0 project-local instruction fixture  
Target: generic-project

Use BlendOps as project-local workflow guidance for Blender planning, readiness, evidence, and handoff.

## Load as guidance

Reference the canonical BlendOps sources from the repository copy or attached project files:

- `docs/ai-agent-install-flow.md`
- `docs/install/generic-project.md`
- `docs/skill-system.md`
- `docs/runtime-stack-strategy.md`
- `skills/README.md`
- `laws/README.md`
- `packs/README.md`
- `packs/product-hero-v0/PACK.md`

Do not duplicate the whole BlendOps repository into the target project unless the user explicitly asks and rollback is documented.

## Runtime stack boundaries

Preserve exactly three public runtime stacks:

1. Claude Desktop official connector stack.
2. Official Blender CLI fallback.
3. Optional unofficial third-party bridge stack.

Direct official MCP use from Claude Code/OpenCode/Cursor/Codex/Gemini is not verified and is not currently a supported BlendOps runtime route.

## Evidence states

Use these states consistently:

- `Not Run`
- `Attempted`
- `Produced`
- `Verified`
- `Failed`

Do not claim preview/render/GLB artifacts without evidence. A valid artifact claim needs output path or visible evidence plus validation notes.

## Preferred flow

1. Plan the workflow.
2. Check runtime readiness.
3. Record evidence state.
4. Validate or downgrade claims.
5. Explain status in non-Blender-user language.

## Runtime boundary

Runtime setup is separate from skill install. This project-local instruction file does not install Blender, configure connector/MCP, run runtime eval, render, export GLB, or create artifacts.

Default status after install:

- Runtime status: `Not Run`
- Artifact status: `Not Produced`
