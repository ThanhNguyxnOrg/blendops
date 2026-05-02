# Target Adapter Architecture

Status: Draft v0

## Why adapters

Adapters prevent hard-coded, brittle install logic per tool. Instead, each target gets a small mapping doc that describes:
- capability profile
- supported scopes
- allowed writes
- verification and rollback

## Core collection vs adapter

- **Core collection**: `skills/`, `laws/`, `packs/` (tool-agnostic)
- **Adapter**: target-specific attachment guidance

Core does not change per tool; adapters map core into tool-native or fallback locations.

For installs across multiple agent surfaces, use [multi-agent-install-strategy.md](./multi-agent-install-strategy.md) as the orchestration layer above per-target adapters.

## Adapter registry

Adapter lookup should be centralized in `docs/adapter-registry.md`.

## Capability profile

Each target adapter references a capability profile with confidence labels and install scope recommendations.

## Install scope selection

Flow:
1. detect target
2. build capability profile
3. choose install scope
4. choose adapter
5. attach core collection
6. verify files
7. report rollback

## Adding a new target later

1. copy `docs/adapters/adapter-template.md`
2. fill capability profile assumptions with confidence labels
3. define supported scopes
4. define fallback behavior
5. add adapter to registry

## Unknown target handling

If target is unknown or path confidence is low:
- use `generic-root` adapter
- create project-root `BLENDOPS.md`
- optionally update `AGENTS.md` only with backup

## Runtime boundary

Adapters attach docs plus root skills/laws/packs only.
They do not install Blender runtime or claim runtime execution success.
