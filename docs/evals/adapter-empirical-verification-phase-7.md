# Adapter Empirical Verification & Evidence Integrity Report (Phase 7 — F-08)

Date: `2026-10-31`
Baseline commit: `4af8b16aad3bdf1dce4114c479002e0b397f3c99`
Scope: Empirical host availability discovery, disposable fixture verification, evidence taxonomy separation, and promotion gate verification across all 26 canonical install targets (`registry/compatibility-matrix.json`).
Runtime status: `Not Run`
Artifact status: `Not Produced`

---

## 1. Purpose & Evidence Integrity Rules

This report records the Phase 7 empirical verification pass for Finding **F-08** (Pillar 7 — Cross-Agent Compatibility). It enforces the canonical promotion policy defined in [`docs/adapter-registry.md`](../adapter-registry.md) and [`registry/compatibility-matrix.json`](../../registry/compatibility-matrix.json):

> **No install target or adapter may be promoted from `linked-only` to `verified-read` or `verified-e2e` based on upstream documentation, static file inspection, simulated output, or generic shell reads alone.**

To prevent conflating different confidence levels, this report strictly separates six distinct evidence categories:

| Evidence Category | Definition | Qualifies for `verified-read` Promotion? | Qualifies for `verified-e2e` Promotion? |
|---|---|---|---|
| **1. Upstream documentation reviewed** | Vendor documentation or upstream repository read to identify instruction file paths, rules syntax, or MCP configuration locations. | **No** (`linked-only`) | **No** |
| **2. Repository-local fixture verified** | BlendOps project-local attachment (`BLENDOPS.md`, backed-up `AGENTS.md` / `CLAUDE.md`, and reversible rollback) created, read-verified with a unique nonce, and rolled back inside an isolated disposable `/tmp` directory. | **Yes, for repo-local markdown fallback/adapter surface only** (`Verified Read (Repo-Local)`, requires dedicated adapter doc in `docs/adapters/`) | **No** |
| **3. Empirical host read verified** | The actual target host binary or application is installed in the execution environment, invoked against an isolated disposable fixture containing a unique verification nonce, and observed reading its project-local instruction surface without fabricating host output. | **Yes** (when paired with dedicated adapter doc in `docs/adapters/`) | **No** |
| **4. Native skill-loader verified** | The target host's native skill or rule loader (`.claude/skills/`, `.cursor/rules/*.mdc`, `.opencode/`, Claude Desktop ZIP upload UI) is empirically exercised inside the real host runtime. | **Yes** (unlocks `tool_native_skill_loader` / `multiple_skills_zip_upload` capability verification) | **No** |
| **5. MCP integration verified** | The target host is empirically connected to Path 1 (Official Blender Lab MCP in Blender 5.1+) or Path 2 (community `mcp-for-blender` in Blender 3.0+). | **N/A** (runtime bridge layer) | **Partial** (read-only smoke only unless E2E packet exists) |
| **6. Blender runtime E2E verified** | End-to-end Blender scene inspection, mutation, render, or GLB export executed through the host and verified with SHA-256 hashes and `inspect-glb.mjs` under `schemas/runtime-evidence-packet.schema.json`. | **Yes** | **Yes** (`verified-e2e`) |

---

## 2. Workstream A — Execution Environment & Host Availability Discovery

### 2.1 Execution Environment Inventory

- **Operating System:** Debian GNU/Linux 12 (bookworm)
- **Kernel / Runtime Sandbox:** `Linux localhost 4.19.0-gvisor #1 SMP x86_64 GNU/Linux` (isolated container environment; no GUI display server, no desktop IDE installations)
- **Node.js / npm / Git:** Node.js `v22.23.4`, npm `10.9.9`, `git version 2.34.1`
- **Discovery Method:** Conservative, non-invasive executable lookup in `PATH` via `bash -c 'type -P <binary>'` and POSIX `command -v`. No global configuration files were modified, no credentials or environment secrets were inspected, no packages or applications were installed, and no paid network API calls were made.
- **Shell Builtin Note (`continue`):** Running POSIX `command -v continue` returns `continue` because `continue` is a standard POSIX loop-control shell builtin; `bash -c 'type -P continue'` confirms no `continue` (Continue.dev) executable binary exists on `PATH`.

### 2.2 Complete 26-Target Host Availability Matrix

| # | Target ID | Canonical Host Name | Consumer Type | Dedicated Adapter Doc | Detected Installation (`type -P`) | Version | Actual Execution Surface Available | Real Host Read Test Performable? | Blocker | Canonical Matrix Status |
|---:|---|---|---|---|---|---|---|---|---|---|
| 1 | `claude-code` | Claude Code | `coding_agent_project_local` | `docs/adapters/claude-code.md` | Binary `claude` not installed; repo-local `CLAUDE.md` / `BLENDOPS.md` + 48-skill exporter available | N/A (host binary absent) | Repo-local markdown attachment + `skills:export` folder layout in disposable `/tmp` fixture | Repo-local fixture: **Yes**; Live `claude` CLI binary: **No** | `claude` CLI binary not installed in container (`BINARY_MISSING:claude`) | `verified-read` (`Verified Read (Repo-Local)`) |
| 2 | `generic-project` | Generic project fallback | `generic_fallback` | `docs/adapters/generic-root.md` | Target-neutral filesystem surface (`Node.js` + `git` present) | Node `v22.23.4` | Repo-local `BLENDOPS.md` + backed-up `AGENTS.md` + rollback in disposable `/tmp` fixture | **Yes** (repo-local universal fallback surface) | None for repo-local fallback; no Blender/MCP runtime | `verified-read` (`Verified Read (Repo-Local)`) |
| 3 | `claude-desktop` | Claude Desktop / Claude.ai | `chat_ui_skills_upload` | `docs/adapters/claude-app.md` | None (desktop GUI / web chat UI) | N/A | 48-skill ZIP archive export (`dist/claude-skills/desktop-zips/*.zip`) | **No** (no Claude Desktop GUI or web upload session in container) | Requires interactive Claude Desktop / Claude.ai UI session | `linked-only` (`Linked Only (Not Verified)`) |
| 4 | `cursor` | Cursor | `coding_agent_project_local` | `docs/adapters/cursor.md` | None (`BINARY_MISSING:cursor`) | N/A | None in live host (upstream docs reviewed 2026-10-14 only) | **No** | Cursor IDE / CLI not installed in headless Linux container | `linked-only` (`Linked Only (Not Verified)`) |
| 5 | `codex` | Codex CLI/App | `coding_agent_project_local` | `docs/adapters/codex.md` | None (`BINARY_MISSING:codex`) | N/A | None in live host (upstream `AGENTS.md` docs reviewed 2026-10-14 only) | **No** | `codex` CLI binary not installed in container | `linked-only` (`Linked Only (Not Verified)`) |
| 6 | `opencode` | OpenCode | `coding_agent_project_local` | `docs/adapters/opencode.md` | None (`BINARY_MISSING:opencode`) | N/A | None in live host | **No** | `opencode` CLI binary not installed in container | `linked-only` (`Linked Only (Not Verified)`) |
| 7 | `aider` | Aider (terminal) | `coding_agent_project_local` | `null` (install-only) | None (`BINARY_MISSING:aider`) | N/A | None | **No** | `aider` binary not installed + no dedicated adapter doc | `linked-only` (`Linked Only (Not Verified)`) |
| 8 | `amazon-q-developer` | Amazon Q Developer CLI | `coding_agent_project_local` | `null` (install-only) | None (`BINARY_MISSING:q`, `BINARY_MISSING:qchat`) | N/A | None | **No** | `q` / `qchat` CLI not installed + no dedicated adapter doc | `linked-only` (`Linked Only (Not Verified)`) |
| 9 | `antigravity` | Google Antigravity | `coding_agent_project_local` | `null` (install-only) | None (no standalone target binary in `PATH`) | N/A | None | **No** | No standalone target host binary + no dedicated adapter doc | `linked-only` (`Linked Only (Not Verified)`) |
| 10 | `augment-code` | Augment Code | `coding_agent_project_local` | `null` (install-only) | None (IDE extension) | N/A | None | **No** | Augment IDE extension not installed + no dedicated adapter doc | `linked-only` (`Linked Only (Not Verified)`) |
| 11 | `blackbox-ai` | Blackbox AI (VS Code extension) | `coding_agent_project_local` | `null` (install-only) | None (`BINARY_MISSING:code`) | N/A | None | **No** | VS Code / Blackbox extension not installed + no dedicated adapter doc | `linked-only` (`Linked Only (Not Verified)`) |
| 12 | `cline` | Cline (VS Code extension) | `coding_agent_project_local` | `null` (install-only) | None (`BINARY_MISSING:cline`, `BINARY_MISSING:code`) | N/A | None | **No** | VS Code / Cline not installed + no dedicated adapter doc | `linked-only` (`Linked Only (Not Verified)`) |
| 13 | `continue` | Continue.dev | `coding_agent_project_local` | `null` (install-only) | None (`BINARY_MISSING:continue`; shell builtin only) | N/A | None | **No** | Continue.dev binary/extension not installed + no dedicated adapter doc | `linked-only` (`Linked Only (Not Verified)`) |
| 14 | `gemini` | Gemini CLI | `coding_agent_project_local` | `null` (install-only) | None (`BINARY_MISSING:gemini`) | N/A | None | **No** | `gemini` CLI binary not installed + no dedicated adapter doc | `linked-only` (`Linked Only (Not Verified)`) |
| 15 | `github-copilot` | GitHub Copilot | `coding_agent_project_local` | `null` (install-only) | None (IDE extension / GitHub host) | N/A | None | **No** | GitHub Copilot IDE host not installed + no dedicated adapter doc | `linked-only` (`Linked Only (Not Verified)`) |
| 16 | `goose` | goose (Block) | `coding_agent_project_local` | `null` (install-only) | None (`BINARY_MISSING:goose`) | N/A | None (upstream Blender MCP tutorial reviewed only) | **No** | `goose` CLI/Desktop not installed + no dedicated adapter doc | `linked-only` (`Linked Only (Not Verified)`) |
| 17 | `jetbrains-junie` | JetBrains Junie / AI Assistant | `coding_agent_project_local` | `null` (install-only) | None (`BINARY_MISSING:junie`) | N/A | None | **No** | JetBrains IDE / Junie not installed + no dedicated adapter doc | `linked-only` (`Linked Only (Not Verified)`) |
| 18 | `openhands` | OpenHands (formerly OpenDevin) | `coding_agent_project_local` | `null` (install-only) | None (`BINARY_MISSING:openhands`) | N/A | None | **No** | `openhands` CLI/runtime not installed + no dedicated adapter doc | `linked-only` (`Linked Only (Not Verified)`) |
| 19 | `roo-code` | Roo Code (VS Code extension) | `coding_agent_project_local` | `null` (install-only) | None (`BINARY_MISSING:code`) | N/A | None | **No** | VS Code / Roo Code extension not installed + no dedicated adapter doc | `linked-only` (`Linked Only (Not Verified)`) |
| 20 | `sourcegraph-cody` | Sourcegraph Cody | `coding_agent_project_local` | `null` (install-only) | None (`BINARY_MISSING:cody`) | N/A | None | **No** | `cody` CLI/extension not installed + no dedicated adapter doc | `linked-only` (`Linked Only (Not Verified)`) |
| 21 | `trae` | Trae (ByteDance AI IDE) | `coding_agent_project_local` | `null` (install-only) | None (`BINARY_MISSING:trae`) | N/A | None | **No** | Trae IDE not installed + no dedicated adapter doc | `linked-only` (`Linked Only (Not Verified)`) |
| 22 | `windsurf` | Windsurf (Codeium IDE — Cascade agent) | `coding_agent_project_local` | `null` (install-only) | None (`BINARY_MISSING:windsurf`) | N/A | None | **No** | Windsurf IDE not installed + no dedicated adapter doc | `linked-only` (`Linked Only (Not Verified)`) |
| 23 | `zed` | Zed editor | `coding_agent_project_local` | `null` (install-only) | None (`BINARY_MISSING:zed`) | N/A | None | **No** | Zed editor not installed + no dedicated adapter doc | `linked-only` (`Linked Only (Not Verified)`) |
| 24 | `lm-studio` | LM Studio (local LLM) | `local_llm_mcp_runner` | `null` (install-only) | None (`BINARY_MISSING:lms`) | N/A | None | **No** | LM Studio / `lms` not installed + no dedicated adapter doc | `linked-only` (`Linked Only (Not Verified)`) |
| 25 | `ollama` | Ollama (local LLM) | `local_llm_mcp_runner` | `null` (install-only) | None (`BINARY_MISSING:ollama`) | N/A | None | **No** | `ollama` binary not installed + no dedicated adapter doc | `linked-only` (`Linked Only (Not Verified)`) |
| 26 | `open-webui` | Open WebUI (local LLM frontend) | `local_llm_mcp_runner` | `null` (install-only) | None (`BINARY_MISSING:open-webui`) | N/A | None | **No** | `open-webui` server not installed + no dedicated adapter doc | `linked-only` (`Linked Only (Not Verified)`) |

---

## 3. Workstream B & C — Per-Target Empirical Verification Records

### Target: generic-project

- Target ID: `generic-project`
- Canonical Host Name: `Generic project fallback`
- Adapter Document: `docs/adapters/generic-root.md`
- Install Guide: `docs/install/generic-project.md`
- Verification Date: `2026-10-31` (re-verifying `2026-05-08` baseline in [`adapter-install-v0-dry-run.md`](./adapter-install-v0-dry-run.md))
- Disposable Fixture Path: `/tmp/blendops-phase7-generic-8aWoHx` (created via `fs.mkdtempSync`, cleaned up in `finally`)
- Files Created / Tested:
  - `AGENTS.md` (pre-existing file, initial SHA-256 `ed3ac0d58ba7429f4193da73960efb6d3ecefc35b1590ddc2b370795cb752f02`)
  - `AGENTS.md.bak` (backup created prior to modification)
  - `BLENDOPS.md` (copied from canonical `bundles/generic-project-local/BLENDOPS.md` plus nonce footer)
- Verification Nonce: `BLENDOPS-PHASE7-NONCE-GENERIC-9F4A2C1E`
- Invocation / Method: Isolated Node.js fixture verification script executing project-root `BLENDOPS.md` attachment, backed-up `AGENTS.md` reference injection, deterministic read-back of the verification nonce across both files, and full rollback restoration.
- Expected Result: Both `BLENDOPS.md` and `AGENTS.md` expose `BLENDOPS-PHASE7-NONCE-GENERIC-9F4A2C1E` and preserve `Runtime status: Not Run` / `Artifact status: Not Produced`; rollback removes `BLENDOPS.md` and `AGENTS.md.bak` and restores `AGENTS.md` to exact SHA-256 `ed3ac0d58ba7429f4193da73960efb6d3ecefc35b1590ddc2b370795cb752f02`.
- Observed Result: Nonce `BLENDOPS-PHASE7-NONCE-GENERIC-9F4A2C1E` read back from both `BLENDOPS.md` and `AGENTS.md`; rollback restored `AGENTS.md` to exact SHA-256 `ed3ac0d58ba7429f4193da73960efb6d3ecefc35b1590ddc2b370795cb752f02` with zero leftover files before `/tmp/blendops-phase7-generic-8aWoHx` was deleted.
- Evidence Type Breakdown:
  - Upstream documentation reviewed: `Yes`
  - Repository-local fixture verified: `Yes`
  - Empirical host read verified: `Yes (Target-neutral repo-local fallback surface)`
  - Native skill-loader verified: `Not Applicable (generic fallback has no tool-native loader)`
  - MCP integration verified: `Not Run`
  - Blender runtime E2E verified: `Not Run`
- Verified Capabilities: `project_local_markdown_attachment`, `reversible_rollback_documented`, `docs_only_reference_guidance`
- Unverified Capabilities: `tool_native_skill_loader`, `mcp_stdio_or_http_host`
- Rollback / Cleanup Result: `Pass` (exact SHA-256 match and disposable `/tmp` directory removed)
- Canonical Matrix Status: `verified-read`
- Final Verdict: `Pass`

### Target: claude-code

- Target ID: `claude-code`
- Canonical Host Name: `Claude Code`
- Adapter Document: `docs/adapters/claude-code.md`
- Install Guide: `docs/install/claude-code.md`
- Verification Date: `2026-10-31` (re-verifying `2026-05-08` baseline in [`adapter-install-v0-dry-run.md`](./adapter-install-v0-dry-run.md))
- Disposable Fixture Path: `/tmp/blendops-phase7-claude-code-Hu7Mqm` (created via `fs.mkdtempSync`, cleaned up in `finally`)
- Files Created / Tested:
  - `CLAUDE.md` (pre-existing file, initial SHA-256 `f0aa4504f330709d883b6ef890fdd78e04de15957279e35e0d3c9853c0b1b37b`)
  - `CLAUDE.md.bak` (backup created prior to modification)
  - `BLENDOPS.md` (project-local entrypoint with nonce)
  - `.blendops-export/claude-code-skills/*/SKILL.md` (isolated 48-skill export via `node scripts/export-claude-skills.mjs --output-root`)
- Verification Nonce: `BLENDOPS-PHASE7-NONCE-CLAUDE-CODE-7B3D8E2A`
- Invocation / Method: Isolated disposable fixture test verifying project-local `CLAUDE.md` + `BLENDOPS.md` attachment, isolated 48-skill Claude Code directory export (`48/48` skills with `SKILL.md`, `EVAL.md`, and `references/`), read-back of `BLENDOPS-PHASE7-NONCE-CLAUDE-CODE-7B3D8E2A`, and complete rollback restoration. Note: The `claude` CLI binary itself is not installed in this container (`BINARY_MISSING:claude`), so verification is strictly scoped to `Verified Read (Repo-Local)` and does **not** claim live `claude` CLI binary execution or `.claude/skills/` native skill-loader verification.
- Expected Result: `CLAUDE.md` and `BLENDOPS.md` contain `BLENDOPS-PHASE7-NONCE-CLAUDE-CODE-7B3D8E2A`, isolated export produces 48 skill folders, and rollback restores `CLAUDE.md` to exact SHA-256 `f0aa4504f330709d883b6ef890fdd78e04de15957279e35e0d3c9853c0b1b37b`.
- Observed Result: Nonce `BLENDOPS-PHASE7-NONCE-CLAUDE-CODE-7B3D8E2A` verified in `CLAUDE.md` and `BLENDOPS.md`, 48/48 exported skill directories verified, and rollback restored `CLAUDE.md` to exact SHA-256 `f0aa4504f330709d883b6ef890fdd78e04de15957279e35e0d3c9853c0b1b37b` before `/tmp/blendops-phase7-claude-code-Hu7Mqm` was deleted.
- Evidence Type Breakdown:
  - Upstream documentation reviewed: `Yes`
  - Repository-local fixture verified: `Yes`
  - Empirical host read verified: `Blocked for live claude CLI binary (binary absent); Pass for repo-local CLAUDE.md/BLENDOPS.md adapter fixture`
  - Native skill-loader verified: `Blocked (.claude/skills/ native loader requires live Claude Code CLI binary)`
  - MCP integration verified: `Not Run`
  - Blender runtime E2E verified: `Not Run`
- Verified Capabilities: `project_local_markdown_attachment`, `reversible_rollback_documented`, `cli_appendix_execution_surface`
- Unverified Capabilities: `tool_native_skill_loader`, `mcp_stdio_or_http_host`
- Rollback / Cleanup Result: `Pass` (exact SHA-256 match and disposable `/tmp` directory removed)
- Canonical Matrix Status: `verified-read`
- Final Verdict: `Pass` (strictly scoped to `Verified Read (Repo-Local)`)

### Target: cursor

- Target ID: `cursor`
- Canonical Host Name: `Cursor`
- Adapter Document: `docs/adapters/cursor.md`
- Install Guide: `docs/install/cursor.md`
- Verification Date: `null` (unverified in live host; upstream documentation reviewed `2026-10-14`, availability checked `2026-10-31`)
- Disposable Fixture Path: `Not Created (host binary absent)`
- Files Created / Tested: `None`
- Verification Nonce: `N/A`
- Invocation / Method: Checked `bash -c 'type -P cursor'`; returned `BINARY_MISSING:cursor`.
- Expected Result: Empirical promotion requires a live Cursor host reading `.cursor/rules/*.mdc` or `AGENTS.md`.
- Observed Result: Cursor is not installed in the container environment. Although Cursor upstream documentation for `.cursor/rules/*.mdc` and `AGENTS.md` discovery was reviewed on `2026-10-14`, upstream documentation review does not qualify for `verified-read` promotion.
- Evidence Type Breakdown:
  - Upstream documentation reviewed: `Yes (2026-10-14)`
  - Repository-local fixture verified: `Covered by generic-project fallback only`
  - Empirical host read verified: `Blocked (Cursor not installed)`
  - Native skill-loader verified: `Blocked (.cursor/rules/*.mdc not exercised in live Cursor host)`
  - MCP integration verified: `Not Run`
  - Blender runtime E2E verified: `Not Run`
- Verified Capabilities: `None in live Cursor host (project_local_markdown_attachment and reversible_rollback_documented via generic fallback only)`
- Unverified Capabilities: `tool_native_skill_loader`, `mcp_stdio_or_http_host`
- Rollback / Cleanup Result: `No files written`
- Canonical Matrix Status: `linked-only`
- Final Verdict: `Blocked`

### Target: codex

- Target ID: `codex`
- Canonical Host Name: `Codex CLI/App`
- Adapter Document: `docs/adapters/codex.md`
- Install Guide: `docs/install/codex.md`
- Verification Date: `null` (unverified in live host; upstream documentation reviewed `2026-10-14`, availability checked `2026-10-31`)
- Disposable Fixture Path: `Not Created (host binary absent)`
- Files Created / Tested: `None`
- Verification Nonce: `N/A`
- Invocation / Method: Checked `bash -c 'type -P codex'`; returned `BINARY_MISSING:codex`.
- Expected Result: Empirical promotion requires invoking `codex` CLI/App against a disposable repository fixture and observing `AGENTS.md` discovery.
- Observed Result: `codex` CLI is not installed in the container environment. Reading `AGENTS.md` via generic shell tools or reviewing upstream Codex docs (`2026-10-14`) does not constitute empirical Codex host verification.
- Evidence Type Breakdown:
  - Upstream documentation reviewed: `Yes (2026-10-14)`
  - Repository-local fixture verified: `Covered by generic-project fallback only`
  - Empirical host read verified: `Blocked (codex CLI not installed)`
  - Native skill-loader verified: `Blocked`
  - MCP integration verified: `Not Run`
  - Blender runtime E2E verified: `Not Run`
- Verified Capabilities: `None in live Codex host (project_local_markdown_attachment and reversible_rollback_documented via generic fallback only)`
- Unverified Capabilities: `tool_native_skill_loader`, `mcp_stdio_or_http_host`
- Rollback / Cleanup Result: `No files written`
- Canonical Matrix Status: `linked-only`
- Final Verdict: `Blocked`

### Target: opencode

- Target ID: `opencode`
- Canonical Host Name: `OpenCode`
- Adapter Document: `docs/adapters/opencode.md`
- Install Guide: `docs/install/opencode.md`
- Verification Date: `null` (availability checked `2026-10-31`)
- Disposable Fixture Path: `Not Created (host binary absent)`
- Files Created / Tested: `None`
- Verification Nonce: `N/A`
- Invocation / Method: Checked `bash -c 'type -P opencode'`; returned `BINARY_MISSING:opencode`.
- Expected Result: Empirical promotion requires invoking `opencode` in a disposable fixture.
- Observed Result: `opencode` is not installed in the container environment.
- Evidence Type Breakdown:
  - Upstream documentation reviewed: `Yes`
  - Repository-local fixture verified: `Covered by generic-project fallback only`
  - Empirical host read verified: `Blocked (opencode CLI not installed)`
  - Native skill-loader verified: `Blocked (.opencode/ path unverified)`
  - MCP integration verified: `Not Run`
  - Blender runtime E2E verified: `Not Run`
- Verified Capabilities: `None in live OpenCode host`
- Unverified Capabilities: `tool_native_skill_loader`, `mcp_stdio_or_http_host`
- Rollback / Cleanup Result: `No files written`
- Canonical Matrix Status: `linked-only`
- Final Verdict: `Blocked`

### Target: claude-desktop

- Target ID: `claude-desktop`
- Canonical Host Name: `Claude Desktop / Claude.ai`
- Adapter Document: `docs/adapters/claude-app.md`
- Install Guide: `docs/install/claude-desktop.md`
- Verification Date: `null` (availability checked `2026-10-31`)
- Disposable Fixture Path: `Not Created (desktop/web GUI host absent)`
- Files Created / Tested: `dist/claude-skills/desktop-zips/*.zip` (48 ZIP packages verified at archive level only; see [`skill-package-upload-readiness-v0.md`](./skill-package-upload-readiness-v0.md))
- Verification Nonce: `N/A`
- Invocation / Method: Checked for Claude Desktop GUI/host availability in container; headless Linux container has no Claude Desktop GUI or authenticated Claude.ai Skills upload session.
- Expected Result: Empirical promotion requires importing/uploading the generated skill ZIPs into a live Claude Desktop / Claude.ai session and verifying skill loading.
- Observed Result: Archive structure is verified (`48/48` ZIPs), but live UI upload/import cannot be executed in this headless container.
- Evidence Type Breakdown:
  - Upstream documentation reviewed: `Yes`
  - Repository-local fixture verified: `Yes (ZIP package structure via skills:export)`
  - Empirical host read verified: `Blocked (no Claude Desktop / Claude.ai UI session)`
  - Native skill-loader verified: `Blocked (UI ZIP import not executed)`
  - MCP integration verified: `Historical Path 1 read-only smoke test recorded separately in blender-connector-read-only-smoke-test.md; not re-run in this container`
  - Blender runtime E2E verified: `Not Run`
- Verified Capabilities: `multiple_skills_zip_upload` (package preparation only), `docs_only_reference_guidance`
- Unverified Capabilities: `project_local_markdown_attachment`, `tool_native_skill_loader`, `mcp_stdio_or_http_host`
- Rollback / Cleanup Result: `No host files written`
- Canonical Matrix Status: `linked-only`
- Final Verdict: `Blocked`

### Remaining 20 Install-Only Targets (`aider` through `open-webui`)

All 20 install-only targets (`aider`, `amazon-q-developer`, `antigravity`, `augment-code`, `blackbox-ai`, `cline`, `continue`, `gemini`, `github-copilot`, `goose`, `jetbrains-junie`, `openhands`, `roo-code`, `sourcegraph-cody`, `trae`, `windsurf`, `zed`, `lm-studio`, `ollama`, `open-webui`) were checked in Workstream A and remain `linked-only` (`Final Verdict: Blocked`) for two independent reasons enforced by `scripts/validate-compatibility-matrix.mjs`:

1. **No Installed Host Runtime:** None of their CLI binaries, IDE extensions, or local LLM server runtimes are installed in this container (`BINARY_MISSING` across all 20 targets).
2. **Install-Only Scope (`adapterDocPath: null`):** None of these 20 targets have a dedicated adapter document under `docs/adapters/`, which is a mandatory prerequisite before any target can be promoted from `linked-only` to `verified-read`.

---

## 4. Summary of Canonical Compatibility Counts After Phase 7

| Metric | Phase 6.1 Baseline | Phase 7 Verified Count | Notes |
|---|---:|---:|---|
| Install targets (`docs/install/*.md`) | 26 | **26** | All 26 install guides synchronized with `registry/compatibility-matrix.json` |
| Dedicated adapter docs (`docs/adapters/*.md`) | 6 | **6** | `claude-code`, `generic-root`, `claude-app`, `cursor`, `codex`, `opencode` |
| Install-only targets (`adapterDocPath: null`) | 20 | **20** | Cannot be promoted without both a dedicated adapter doc and empirical host evidence |
| `verified-read` targets | 2 | **2** | `claude-code` and `generic-project` (`Verified Read (Repo-Local)`) |
| `linked-only` targets | 24 | **24** | 0 targets promoted without live host execution; documentation contradictions in `cursor.md`, `codex.md`, `gemini.md`, `goose.md`, and `docs/install/README.md` resolved |
| `verified-e2e` targets | 0 | **0** | Blender runtime status remains `Not Run`; artifact status remains `Not Produced` |
