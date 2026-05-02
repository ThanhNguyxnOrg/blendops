# agents/ — Target-specific metadata

Status: Draft v0

## Purpose

This folder contains target-specific metadata files for BlendOps skill package consumers. These files are not the universal multi-agent adapter layer; they are consumer-specific metadata for particular skill upload/import surfaces.

## Current files

### `openai.yaml`

OpenAI/ChatGPT Skills UI metadata only. This file provides display metadata (`display_name`, `short_description`) for OpenAI/ChatGPT skill upload compatibility.

**What it is:**
- OpenAI/ChatGPT-specific metadata for Skills UI upload.

**What it is not:**
- It does not configure Claude Desktop.
- It does not configure Claude Code.
- It does not configure OpenCode.
- It does not configure Cursor.
- It does not configure Codex.
- It does not configure Gemini.
- It does not configure Antigravity.
- It does not configure GitHub Copilot.
- It is not the universal multi-agent adapter layer.

## Multi-agent support

Multi-agent support comes from:

1. **Portable core content** — `SKILL.md` + `references/` are target-neutral and can be imported/copied by compatible skill systems.
2. **Install docs** — `docs/install/` provides per-target install guidance for Claude Desktop, Claude Code, OpenCode, Cursor, Codex, Gemini, Antigravity, GitHub Copilot, and generic project-local fallback.
3. **Adapter layers** — Future adapter bundles may map the same core package into target-specific locations (`.claude`, `.opencode`, `.cursor`, `.agents`, `.gemini`, `.agent`, `.github`, etc.) when those paths are verified.

See:
- `docs/multi-agent-install-strategy.md`
- `docs/target-adapter-architecture.md`
- `docs/install/README.md`

## Adding target-specific metadata

If a new skill surface requires metadata beyond the portable core:

1. Add a new file in this folder (e.g., `claude-desktop.json`, `cursor.yaml`).
2. Document its purpose and scope in this README.
3. Clarify that it is target-specific metadata, not a universal adapter.
4. Update `docs/multi-agent-install-strategy.md` if the new surface changes the install model.

## Non-actions

Target-specific metadata files do not:

- install Blender,
- configure runtime bridges,
- run Blender or runtime eval,
- produce preview/render/GLB artifacts.

Runtime status remains `Not Run` and artifact status remains `Not Produced` unless a separate eval record provides evidence.
