# 📚 BlendOps Documentation

BlendOps docs are organized around the current **minimal safe runtime foundation** direction.

## Start here (foundation)

| Need | Read |
|---|---|
| Product direction | [product-direction.md](./product-direction.md) |
| Prune/recenter decisions | [foundation-prune-audit.md](./foundation-prune-audit.md) |
| Runtime parity baseline | [runtime-foundation-parity.md](./runtime-foundation-parity.md) |
| Install and bridge bootstrap | [install.md](./install.md) |
| MCP setup | [mcp-setup.md](./mcp-setup.md) |
| Observability/status/logs | [observability.md](./observability.md) |
| Manual runtime checks | [manual-test.md](./manual-test.md) |

## Core references

- [Official Blender CLI reference notes](./blender-cli-reference.md)
- [Prior art overview](./prior-art.md)

## Runtime evidence (foundation-first)

| Evidence | Focus |
|---|---|
| [runtime-smoke-test-installability.md](./runtime-smoke-test-installability.md) | Source installability + CLI exposure + setup checks |
| [runtime-smoke-test-onboarding.md](./runtime-smoke-test-onboarding.md) | Fresh-clone onboarding baseline |

## Frozen/de-emphasized evidence and breadth docs

These docs are retained for compatibility/history, but are not current top-level product promise:

- operation-breadth smoke tests (`object/material/lighting/camera/render/validate/export/undo/scene-clear/batch*`)
- [runtime-smoke-test-batch-execute-dry-run.md](./runtime-smoke-test-batch-execute-dry-run.md) (retained for compatibility checks)
- broad eval catalogs and recipe-oriented prompts
- deep implementation mining snapshots

## Historical/archive-oriented docs

- `docs/roadmap.md` (superseded by root `TODO.md`)
- early broad-scope runtime snapshots kept for traceability

## Compatibility

[docs/INDEX.md](./INDEX.md) remains as a compatibility redirect.
