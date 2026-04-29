# BlendOps Install Strategy

Status: Draft v0

## v0 install philosophy

BlendOps v0 is a docs/skill-pack adoption layer, not a runtime installer.

## Core collection

- `skills/`
- `laws/`
- `packs/`

Core collection is tool-agnostic.

## Install scopes

See `docs/install-scopes.md`.

Default: project-local.

Global install is opt-in only and requires:
- explicit user approval
- verified path
- backup + rollback

## Target adapters

BlendOps uses adapters instead of fixed hard-coded install logic.

See:
- `docs/target-adapter-architecture.md`
- `docs/adapters/README.md`
- `docs/adapter-registry.md`

## Capability profiles

Each install run should build a capability profile before writing files.

See:
- `docs/capability-profile.md`

## Generic-root fallback

If tool-native path is unverified, use generic-root fallback:
- create `BLENDOPS.md`
- optionally update `AGENTS.md` with backup

## Official runtime prerequisite

Runtime setup remains external and official-only:
1. Official Blender MCP Server
2. Official Claude Blender Connector
3. Official Blender CLI docs

## Claude Code vs Claude app

Treat these as separate targets:
- Claude Code: workspace/agent attachment path
- Claude app/Desktop: connector/runtime context and docs-first guidance

Do not assume Claude Code paths apply to Claude app/Desktop.

## Rollback model

Every install must report:
- changed files
- backup files
- rollback steps

## Non-goals

- no runtime code installation
- no runtime execution claims
- no custom CLI/MCP/addon ownership
