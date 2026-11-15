# Generic Project-Local BlendOps Bundle

Status: 1.0.0 reference fixture  
Target: `generic-project`

## What this bundle is

This is a static, inspectable project-local install fixture for BlendOps. It gives an AI coding agent a minimal set of files it can copy into another repository when target detection is unknown or ambiguous.

This directory is a static reference fixture only; it is not itself an installer script, an npm package, a separate release artifact, an official marketplace listing, or a runtime setup. For the published CLI, use [`blendops@1.0.0`](https://www.npmjs.com/package/blendops); for direct Agent Skills installation, use [`skills.sh`](https://www.skills.sh/ThanhNguyxnOrg/blendops).

## When to use it

Use this bundle when:

- no target-specific AI coding agent path is verified,
- multiple targets are detected and the user chooses the generic fallback,
- a project needs reversible BlendOps instructions without global config writes,
- automated or manual fallback installs need a small reference fixture to copy from or validate against.

## When not to use it

Do not use this bundle when:

- the user asked for a verified target-native install path and that path is known,
- the user expects Blender runtime setup,
- the user expects a Claude Desktop Connector or Blender MCP bridge configuration,
- the user expects preview/render/GLB artifacts,
- the user expects to invoke the published npm CLI directly (use `npx blendops` instead of copying this static fixture),
- the user expects an official marketplace install (no such listing is claimed).

## Relationship to install docs

- Main paste prompt: [docs/ai-agent-install-flow.md](../../docs/ai-agent-install-flow.md)
- Generic target doc: [docs/install/generic-project.md](../../docs/install/generic-project.md)
- Installer & CLI spec: [docs/install/installer-spec.md](../../docs/install/installer-spec.md)

This fixture serves as the static manual reference alongside the local repository installer (`scripts/install-skills.mjs`) and distributable CLI (`bin/blendops.mjs`).

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
