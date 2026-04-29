# Markdown Cleanup Audit

_Last updated: 2026-04-29_

This audit classifies every Markdown file in the repository (excluding `node_modules` and `.git`) for the current product/workflow-layer direction.

## Status legend

- **ACTIVE**: belongs in current product-layer docs set
- **ARCHIVE**: historical only; stays under `docs/archive/`
- **DELETE**: remove file (redundant/misleading/recoverable)
- **MERGE**: merge content into another active file, then remove or freeze source
- **REWRITE**: keep path but rewrite/polish for current direction

## File audit

| File | Status | Reason | Action |
|---|---|---|---|
| `README.md` | REWRITE | Core landing page needs stronger product-style hierarchy and visual polish. | Keep file; rewrite as product entrypoint with clear runtime boundary. |
| `TODO.md` | ACTIVE | Current roadmap still relevant and aligned to product-layer execution phases. | Keep active; update as phases complete. |
| `CODE_OF_CONDUCT.md` | ACTIVE | Standard governance file; not runtime-direction dependent. | Keep unchanged. |
| `CONTRIBUTING.md` | REWRITE | Contribution language still leans runtime-era and command-surface assumptions. | Rewrite around product/workflow docs and boundaries. |
| `SECURITY.md` | REWRITE | Security scope references removed runtime transport details too directly. | Rewrite security scope for product-layer + external-runtime model. |
| `SUPPORT.md` | REWRITE | Contains broken links to moved docs and runtime-era support framing. | Rewrite with active doc links and archive boundaries. |
| `docs/README.md` | REWRITE | Good index but can be polished as a clean docs homepage with start flow. | Keep path; polish structure and callouts. |
| `docs/INDEX.md` | DELETE | Redundant compatibility pointer duplicating docs index function. | Removed in this cleanup pass to reduce duplicate entrypoints. |
| `docs/product-direction.md` | ACTIVE | Canonical product thesis and non-goals are aligned. | Keep active; minor polish only. |
| `docs/external-runtime-setup.md` | ACTIVE | Canonical setup prerequisite for external runtime assumptions. | Keep active as required first-step guide. |
| `docs/reference-runtime.md` | ACTIVE | Runtime boundary/reference doc is valuable and complementary. | Keep active; ensure concise cross-links to setup doc. |
| `docs/first-user-journey.md` | ACTIVE | High-level user journey spec remains useful for product context. | Keep active; polish language and consistency over time. |
| `docs/golden-path-cyberpunk-shoe.md` | ACTIVE | First concrete golden-path spec for non-Blender users. | Keep active. |
| `docs/workflow-contract.md` | ACTIVE | Product contract doc is useful for future implementation consistency. | Keep active. |
| `docs/safety-model.md` | ACTIVE | Product-layer safety boundary is essential and current. | Keep active. |
| `docs/architecture.md` | ACTIVE | Target architecture is aligned and concise. | Keep active. |
| `docs/reset-audit.md` | ACTIVE | Historical transition log still useful to explain reset decisions. | Keep active but clearly label as historical-transition context. |
| `docs/archive/README.md` | ARCHIVE | Correct archive entrypoint for historical runtime-era docs. | Keep in archive. |
| `docs/archive/ai-agent-usage.md` | ARCHIVE | Runtime-era command usage and bridge flows are historical only. | Keep archived. |
| `docs/archive/batch-execute-safety-contract.md` | ARCHIVE | Old runtime contract no longer active in product-layer docs. | Keep archived. |
| `docs/archive/blender-cli-reference.md` | ARCHIVE | Detailed runtime reference is historical; active docs now summarize and link upstream. | Keep archived. |
| `docs/archive/bridge-lifecycle-prior-art.md` | ARCHIVE | Prior-art technical archaeology; not active product onboarding. | Keep archived. |
| `docs/archive/evals.md` | ARCHIVE | Runtime-era eval catalog not part of active guidance. | Keep archived. |
| `docs/archive/examples-prompts.md` | ARCHIVE | Historical prompts tied to old runtime framing. | Keep archived. |
| `docs/archive/foundation-prune-audit.md` | ARCHIVE | Legacy audit superseded by reset-era docs. | Keep archived. |
| `docs/archive/implementation-mining.md` | ARCHIVE | Historical implementation-mining report only. | Keep archived. |
| `docs/archive/inheritance-foundation.md` | ARCHIVE | Legacy foundational framing superseded by current product docs. | Keep archived. |
| `docs/archive/install.md` | ARCHIVE | Old setup commands for removed runtime surfaces. | Keep archived only. |
| `docs/archive/manual-test.md` | ARCHIVE | Runtime manual test playbook for removed command surfaces. | Keep archived only. |
| `docs/archive/mcp-setup.md` | ARCHIVE | Historical custom MCP setup doc; active setup now external-reference based. | Keep archived only. |
| `docs/archive/observability.md` | ARCHIVE | Runtime observability procedures for removed surfaces. | Keep archived. |
| `docs/archive/prior-art-implementation-patterns.md` | ARCHIVE | Research-only prior-art synthesis; not active docs path. | Keep archived. |
| `docs/archive/prior-art.md` | ARCHIVE | Historical prior-art catalog. | Keep archived. |
| `docs/archive/roadmap.md` | ARCHIVE | Superseded by root `TODO.md`. | Keep archived. |
| `docs/archive/runtime-foundation-parity.md` | ARCHIVE | Historical parity matrix for removed runtime focus. | Keep archived. |
| `docs/archive/runtime-smoke-test.md` | ARCHIVE | Runtime evidence report from old architecture. | Keep archived. |
| `docs/archive/runtime-smoke-test-batch-execute-dry-run.md` | ARCHIVE | Runtime smoke-test artifact; historical only. | Keep archived. |
| `docs/archive/runtime-smoke-test-batch-execute-real.md` | ARCHIVE | Runtime smoke-test artifact; historical only. | Keep archived. |
| `docs/archive/runtime-smoke-test-batch-plan.md` | ARCHIVE | Runtime smoke-test artifact; historical only. | Keep archived. |
| `docs/archive/runtime-smoke-test-camera.md` | ARCHIVE | Runtime smoke-test artifact; historical only. | Keep archived. |
| `docs/archive/runtime-smoke-test-export.md` | ARCHIVE | Runtime smoke-test artifact; historical only. | Keep archived. |
| `docs/archive/runtime-smoke-test-installability.md` | ARCHIVE | Runtime smoke-test artifact; historical only. | Keep archived. |
| `docs/archive/runtime-smoke-test-lighting.md` | ARCHIVE | Runtime smoke-test artifact; historical only. | Keep archived. |
| `docs/archive/runtime-smoke-test-material.md` | ARCHIVE | Runtime smoke-test artifact; historical only. | Keep archived. |
| `docs/archive/runtime-smoke-test-object-transform.md` | ARCHIVE | Runtime smoke-test artifact; historical only. | Keep archived. |
| `docs/archive/runtime-smoke-test-observability.md` | ARCHIVE | Runtime smoke-test artifact; historical only. | Keep archived. |
| `docs/archive/runtime-smoke-test-onboarding.md` | ARCHIVE | Runtime smoke-test artifact; historical only. | Keep archived. |
| `docs/archive/runtime-smoke-test-render.md` | ARCHIVE | Runtime smoke-test artifact; historical only. | Keep archived. |
| `docs/archive/runtime-smoke-test-request-correlation.md` | ARCHIVE | Runtime smoke-test artifact; historical only. | Keep archived. |
| `docs/archive/runtime-smoke-test-scene-clear.md` | ARCHIVE | Runtime smoke-test artifact; historical only. | Keep archived. |
| `docs/archive/runtime-smoke-test-undo.md` | ARCHIVE | Runtime smoke-test artifact; historical only. | Keep archived. |
| `docs/archive/runtime-smoke-test-validate.md` | ARCHIVE | Runtime smoke-test artifact; historical only. | Keep archived. |
| `docs/markdown-cleanup-audit.md` | ACTIVE | Current audit source-of-truth for markdown cleanup decisions. | Keep active and update as docs evolve. |

## Cleanup decisions for this pass

1. Keep all historical runtime-era files under `docs/archive/`.
2. Keep optional-but-useful active docs (`workflow-contract.md`, `safety-model.md`, `golden-path-cyberpunk-shoe.md`).
3. Rewrite/polish active entrypoint and root operational docs (`README.md`, `docs/README.md`, `SUPPORT.md`, `CONTRIBUTING.md`, `SECURITY.md`).
4. Remove duplicate docs entrypoints (`docs/INDEX.md`) to keep a single canonical index (`docs/README.md`).
