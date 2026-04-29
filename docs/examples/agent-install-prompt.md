# BlendOps Agent Install Prompts

## A. Adaptive install prompt

Install BlendOps in this project using the adapter model:
https://raw.githubusercontent.com/ThanhNguyxnOrg/blendops/main/docs/agent-install.md

Build a capability profile first.
Use project-local install by default.
Use generic-root fallback if tool-native support is not verified.
Do not install Blender runtime.
Do not run Blender.
Do not modify global config unless I explicitly ask.
Report adapter, scope, files changed, and rollback steps.

## B. Generic-root install prompt

Attach BlendOps using generic-root fallback only.
Create BLENDOPS.md in the project root and link/copy the BlendOps skills/laws/packs as needed.
Do not touch tool-specific config.

## C. Global install prompt

Install BlendOps globally for <tool>.
Only proceed if the global path is verified, backup is created, and rollback is documented.
Ask me before writing any global config.

## D. Claude app setup prompt

Set up BlendOps guidance for Claude app/Desktop using docs/reference mode.
Do not assume Claude Code workspace paths.
Keep runtime setup external and official-only.
Do not install Blender runtime or run Blender.

## Agent fetch command

`curl -s https://raw.githubusercontent.com/ThanhNguyxnOrg/blendops/main/docs/agent-install.md`

## First use prompt after install

Use the BlendOps v0 product hero pack to plan a cyberpunk shoe web hero with a floating shoe, neon lights, glossy dark floor, cinematic camera, GLB handoff expectations, and non-Blender-user explanation.

Do not claim preview/render/GLB exists unless runtime evidence exists.
