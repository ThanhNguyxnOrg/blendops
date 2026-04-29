# Reset Audit — Product-Layer Rebuild

Date: 2026-04-28  
Branch: `reset/product-layer-rebuild`  
Baseline reference: commit `04c70db` (last custom-runtime baseline)

> Historical scope note: references to deleted runtime paths (for example `apps/mcp-server`, `apps/blender-addon`, runtime scripts) are audit-history records only. They are not active setup or usage guidance.

## Action labels

- **DELETE**: Remove from active codebase because it represents old custom runtime implementation.
- **KEEP**: Keep active because it still fits the reset direction.
- **REWRITE**: Keep path but replace contents to match new truth.
- **ARCHIVE**: Keep historical context under `docs/archive/`, not active docs.
- **CREATE**: New docs needed for product/workflow-layer direction.

## Audit table

| Area/File | Action | Reason | Recovery path |
|---|---|---|---|
| `README.md` | REWRITE | Currently claims active custom CLI/MCP/addon workflow; must represent product-layer reset truth. | `git checkout 04c70db -- README.md` |
| `TODO.md` | REWRITE | Runtime-foundation roadmap no longer matches direction. | `git checkout 04c70db -- TODO.md` |
| `package.json` | REWRITE | Contains runtime workspaces/bin/scripts (`doctor`, `uat`, CLI/MCP build paths) that will be deleted. | `git checkout 04c70db -- package.json` |
| `package-lock.json` | REWRITE | Lock graph includes removed runtime workspaces. Must regenerate for new minimal package shape. | `git checkout 04c70db -- package-lock.json` |
| `apps/cli` | DELETE | Custom BlendOps CLI runtime surface is no longer active product direction. | `git checkout 04c70db -- apps/cli` |
| `apps/mcp-server` | DELETE | Custom BlendOps MCP runtime server is no longer active product direction. | `git checkout 04c70db -- apps/mcp-server` |
| `apps/blender-addon` | DELETE | Custom BlendOps addon/bridge implementation is removed from active codebase. | `git checkout 04c70db -- apps/blender-addon` |
| `packages/core` | DELETE | Runtime bridge lifecycle/client internals tied to removed custom runtime. | `git checkout 04c70db -- packages/core` |
| `packages/schemas` | DELETE | Typed operation surface tied to removed custom runtime. | `git checkout 04c70db -- packages/schemas` |
| `scripts/doctor.ps1` | DELETE | Runtime-specific install/bridge health script for removed runtime. | `git checkout 04c70db -- scripts/doctor.ps1` |
| `scripts/run-uat.ps1` | DELETE | Runtime-specific UAT for removed runtime. | `git checkout 04c70db -- scripts/run-uat.ps1` |
| `scripts/check-operation-manifest.mjs` | DELETE | Validates operation parity across removed runtime surfaces. | `git checkout 04c70db -- scripts/check-operation-manifest.mjs` |
| `scripts/check-docs.mjs` | DELETE | Existing checks enforce runtime-era docs/phrases and removed runtime claims. | `git checkout 04c70db -- scripts/check-docs.mjs` |
| `examples/batch` | DELETE | Runtime batch fixtures tied to removed operation runtime surface. | `git checkout 04c70db -- examples/batch` |
| `examples/prompts/README.md` | ARCHIVE | Useful historical prompt framing, but tied to removed runtime operations. | `git checkout 04c70db -- examples/prompts/README.md` |
| `docs/runtime-smoke-test*.md` | ARCHIVE | Historical runtime evidence; should not appear as active product docs. | `git checkout 04c70db -- docs/runtime-smoke-test*.md` |
| `docs/install.md` | ARCHIVE | Active instructions currently tell users to run removed custom runtime commands. | `git checkout 04c70db -- docs/install.md` |
| `docs/mcp-setup.md` | ARCHIVE | Active custom MCP runtime setup docs no longer applicable. | `git checkout 04c70db -- docs/mcp-setup.md` |
| `docs/manual-test.md` | ARCHIVE | Runtime command/UAT playbook tied to removed runtime. | `git checkout 04c70db -- docs/manual-test.md` |
| `docs/observability.md` | ARCHIVE | Observability guidance tied to removed custom bridge lifecycle. | `git checkout 04c70db -- docs/observability.md` |
| `docs/ai-agent-usage.md` | ARCHIVE | Agent usage assumes removed custom CLI/MCP/addon command surfaces. | `git checkout 04c70db -- docs/ai-agent-usage.md` |
| `docs/implementation-mining.md` | ARCHIVE | Historical implementation-mining context. | `git checkout 04c70db -- docs/implementation-mining.md` |
| `docs/bridge-lifecycle-prior-art.md` | ARCHIVE | Historical bridge lifecycle research context. | `git checkout 04c70db -- docs/bridge-lifecycle-prior-art.md` |
| `docs/batch-execute-safety-contract.md` | ARCHIVE | Runtime batch contract for removed runtime surface. | `git checkout 04c70db -- docs/batch-execute-safety-contract.md` |
| `docs/prior-art*.md` | ARCHIVE | Historical reference set; not active product onboarding docs. | `git checkout 04c70db -- docs/prior-art.md` |
| `docs/runtime-foundation-parity.md` | ARCHIVE | Foundation-runtime framing is now historical after reset. | `git checkout 04c70db -- docs/runtime-foundation-parity.md` |
| `docs/foundation-prune-audit.md` | ARCHIVE | Prior state decision log; no longer active decision source after reset. | `git checkout 04c70db -- docs/foundation-prune-audit.md` |
| `docs/evals.md` | ARCHIVE | Runtime-operation eval catalog tied to removed runtime surface. | `git checkout 04c70db -- docs/evals.md` |
| `docs/roadmap.md` | ARCHIVE | Historical roadmap superseded by rewritten root TODO. | `git checkout 04c70db -- docs/roadmap.md` |
| `docs/README.md` | REWRITE | Must become new active docs index for product-layer direction. | `git checkout 04c70db -- docs/README.md` |
| `docs/product-direction.md` | REWRITE | Keep path but rewrite to explicit product/workflow-layer direction. | `git checkout 04c70db -- docs/product-direction.md` |
| `docs/reference-runtime.md` | CREATE | New concise external-runtime reference (Blender CLI + blender-mcp). | N/A (new file) |
| `docs/first-user-journey.md` | CREATE | New non-Blender-user golden-path spec. | N/A (new file) |
| `docs/architecture.md` | CREATE | New architecture for product/workflow layer over external runtime. | N/A (new file) |
| `docs/archive/` | CREATE | Dedicated historical location to avoid misleading active docs. | N/A (new directory) |
| Tracked generated outputs (`exports/`, `renders/`, `.tmp/`, `dist/`, `__pycache__`) | DELETE if tracked | These are generated artifacts and should not be active product sources. Current repo audit found no tracked generated artifacts in git index. | `git ls-files` + recover via commit history if previously tracked |

## Notes

- Old custom runtime artifacts remain recoverable from git history.
- Recovery baseline for this reset is explicitly commit `04c70db`.
- Post-reset active docs must not instruct users to run deleted BlendOps runtime commands.
