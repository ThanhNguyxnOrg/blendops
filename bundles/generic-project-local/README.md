# Generic Project-Local BlendOps Bundle

Status: Draft v0 reference fixture  
Target: `generic-project`

## What this bundle is

This is a static, inspectable project-local install fixture for BlendOps. It gives an AI coding agent a minimal set of files it can copy into another repository when target detection is unknown or ambiguous.

It is not an installer script, npm package, release artifact, marketplace listing, or runtime setup.

## When to use it

Use this bundle when:

- no target-specific AI coding agent path is verified,
- multiple targets are detected and the user chooses the generic fallback,
- a project needs reversible BlendOps instructions without global config writes,
- future installer work needs a small reference fixture to copy from or validate against.

## When not to use it

Do not use this bundle when:

- the user asked for a verified target-native install path and that path is known,
- the user expects Blender runtime setup,
- the user expects a Claude Desktop Connector or Blender MCP bridge configuration,
- the user expects preview/render/GLB artifacts,
- the user expects a published package or marketplace install.

## Relationship to install docs

- Main paste prompt: [docs/ai-agent-install-flow.md](../../docs/ai-agent-install-flow.md)
- Generic target doc: [docs/install/generic-project.md](../../docs/install/generic-project.md)
- Future installer spec: [docs/install/installer-spec.md](../../docs/install/installer-spec.md)

This fixture is the first static reference bundle for the future installer spec. The script is still not implemented.

## Bundle contents

| File | Purpose |
|---|---|
| `BLENDOPS.md` | Project instruction file to copy into a target project root. |
| `ROLLBACK.md` | Manual rollback instructions. |
| `INSTALL_REPORT_TEMPLATE.md` | Report template for install attempts. |
| `manifest.json` | Machine-readable fixture metadata. |

## Install sketch

Manual copy only:

1. Copy `BLENDOPS.md` to the target project root.
2. If patching `AGENTS.md` later, back it up first.
3. Do not write global config.
4. Fill out `INSTALL_REPORT_TEMPLATE.md` after the install attempt.
5. Keep `ROLLBACK.md` with the install notes or copy its steps into the report.

## Runtime boundary

Skill install is not runtime setup.

This bundle does not:

- install Blender,
- configure Claude Desktop Connector,
- configure the official Blender MCP bridge/add-on,
- configure third-party runtime bridges,
- run Blender,
- run runtime eval,
- create, render, export, or claim preview/render/GLB artifacts.

Runtime status remains `Not Run`. Artifact status remains `Not Produced` until evidence exists.
