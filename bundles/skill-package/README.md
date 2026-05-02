# BlendOps skill package

Status: Draft v0 canonical portable skill package source

## Purpose

`bundles/skill-package/blendops/` is the canonical portable skill package source for BlendOps. It is the content-layer package that target-specific installers, manual import flows, and future adapter bundles should map into their own surfaces.

## Portable core content

The portable core is:

- `blendops/SKILL.md` — the package entrypoint.
- `blendops/references/` — flattened BlendOps skill, law, pack, runtime-boundary, and evidence-rule references.
- `blendops/LICENSE.txt` — license text for redistributed package form.

Those files are the target-neutral BlendOps skill content. They can be copied, referenced, or imported by compatible skill systems without implying a Blender runtime has been configured.

## Target-specific metadata

`blendops/agents/openai.yaml` is one consumer-specific metadata file for OpenAI/ChatGPT Skills UI upload compatibility. It is not the universal multi-agent adapter layer and does not configure Claude Desktop, Claude Code, OpenCode, Cursor, Codex, Gemini, Antigravity, GitHub Copilot, or the generic project-local fallback.

Other targets use separate install docs and adapter layers. Current guidance lives under `docs/install/`, `docs/multi-agent-install-strategy.md`, and `docs/target-adapter-architecture.md`; future adapter bundles may map this same core package into target-specific locations such as `.claude`, `.opencode`, `.cursor`, `.agents`, `.gemini`, `.agent`, or `.github` when those paths are verified.

## Non-actions

This package does not:

- install Blender,
- configure Claude Desktop Connector,
- configure the official Blender MCP bridge/add-on,
- configure third-party runtime bridges,
- run Blender,
- run runtime eval,
- produce preview/render/GLB artifacts,
- publish a package or marketplace listing.

Runtime status remains `Not Run` and artifact status remains `Not Produced` unless a separate eval record provides evidence.
