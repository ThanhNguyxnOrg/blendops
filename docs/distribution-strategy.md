# Distribution Strategy

Status: Draft v0 strategy  
Scope: BlendOps content distribution, not Blender runtime distribution

> [!CAUTION]
> This document does not claim BlendOps is published in any marketplace, package registry, extension catalog, or official plugin listing. Distribution beyond docs and project-local/manual use is future and evidence-gated.

---

## Distribution levels

| Level | Name | Meaning | Current v0 posture |
|---:|---|---|---|
| 0 | Docs-only/reference | Users read docs, copy prompts, or link source material without installing files. | Present in repo docs now. |
| 1 | Project-local file install | Users or agents copy/reference BlendOps docs, skills, laws, packs, and `.blendops/catalog/*` inside a project. | Preferred near-term route; supported via [AI Agent Install Flow](./ai-agent-install-flow.md) and local CLI (`bin/blendops.mjs` / `scripts/install-skills.mjs`). |
| 2 | User-managed Claude Desktop skill import + shared catalog attachment | User manually imports BlendOps skill ZIPs (`dist/claude-skills/desktop-zips/*.zip`) and optionally attaches `dist/shared-catalog/blendops-knowledge-and-recipes.zip` to Claude Project Knowledge. | Candidate route; exportable via `npm run skills:export` or `blendops install --target claude-desktop --out <dir> --write`; must stay separate from connector setup. |
| 3 | GitHub/raw/plugin-from-repo install | Tool consumes content directly from a GitHub URL, raw file, or repo plugin reference. | Future; must follow target tool format. |
| 4 | Tool-native package/extension & CLI tarball | BlendOps ships in a packable CLI tarball (`npm pack`) or tool-native package format. | Local CLI & `npm pack` tarball verified in `scripts/test-phase11.mjs`; public npm registry publish remains deferred (`"private": true`). |
| 5 | Official marketplace listing | BlendOps appears in an official marketplace/catalog with review or approval as required. | Future only; do not claim until published and verified. |

v0 should not depend on Level 5.

---

## Permission and approval expectations

| Distribution route | Approval expectation | Requirement before claiming availability |
|---|---|---|
| User-managed install | No marketplace approval needed. | Clear manual instructions and rollback/safety caveats. |
| GitHub/raw install | No official listing needed, but must follow tool format. | Source-backed tool syntax and successful install evidence. |
| Tool-native package | May require package format, local validation, and compatibility testing. | Package exists, installs cleanly, and has rollback/upgrade notes. |
| Official marketplace | May require platform approval, review, listing permission, or policy compliance. | Marketplace listing is published and install evidence is recorded. |

Do not claim availability until it is verified for the specific surface.

---

## Surface matrix

| Surface | Best near-term install route | Needs marketplace approval? | User manual step? | Runtime bridge separate? | Current confidence |
|---|---|---:|---:|---:|---|
| Claude Desktop Personal Skills | User-managed manual skill import or docs attachment. | No for manual import; yes if future marketplace/listing is pursued. | Yes | Yes | linked-only |
| Claude Desktop Blender Connector | Not a BlendOps content install route; official connector setup is separate. | No BlendOps marketplace dependency. | Yes | It is the runtime bridge path. | read-only smoke evidence available |
| Claude Code | Project-local file install or verified tool-native skill path. | Not for project-local; future plugin/listing may. | Maybe | Yes | verified-read for project-local, native path environment-dependent |
| OpenCode | Project-local file install now; future plugin-style repo install if verified. | Not for project-local; maybe for any future catalog. | Maybe | Yes | linked-only |
| Cursor | Project-local rules/docs attachment if verified. | Not for project-local; maybe for extension marketplace later. | Maybe | Yes | linked-only |
| Codex CLI/App | Generic project instruction or future adapter. | Unknown for future app distribution. | Maybe | Yes | linked-only |
| Gemini CLI | Docs-only/reference until adapter is researched. | Unknown for future extension distribution. | Yes | Yes | not researched |
| Generic root fallback | `BLENDOPS.md`, `AGENTS.md`, or copied core collection references. | No | Maybe | Yes | verified-read |

---

## Claude Desktop special note

Claude Desktop has separate user journeys:

- **Personal skill import**: the user manually imports or attaches BlendOps skill content. This makes the workflow/law/pack guidance available to Claude Desktop, but it does not prove Blender runtime access.
- **Blender Connector setup**: the user separately enables and connects the official Blender Connector. The Blender-side MCP bridge/server must be running for runtime access.

Skill import does not prove connector setup. Connector read-only access does not prove full runtime eval, render/export behavior, or artifact validation.

If the canonical package source `bundles/skill-package/blendops/` is used as upload/import material, its `agents/openai.yaml` file remains OpenAI/ChatGPT Skills UI metadata only. It is not Claude Desktop connector setup and is not cross-agent adapter configuration.

---

## npm package readiness & registry `E404` boundary

Phase 11 packages BlendOps as a self-contained CLI (`bin/blendops.mjs`) that can be packed into a local tarball (`npm pack`) and installed into a local consumer project (`npm install ./blendops-0.1.0-draft.tgz`, invoked via `node_modules/.bin/blendops`, `node node_modules/blendops/bin/blendops.mjs`, or `npx --no-install blendops`).

- **`"private": true` preserved:** `package.json` intentionally retains `"private": true` as a hard guard against accidental `npm publish`.
- **No public npm release:** BlendOps is **not** published to the public npm registry (`Not Published`). Do not claim that `npx blendops` or `npm install -g blendops` can fetch a publicly published package.
- **Registry `E404` check limitation:** During Phase 11 namespace verification, querying the public npm registry (`npm view`) for `blendops`, `@blendops/cli`, and `@thanhnguyxn/blendops` returned `E404` (`Not Found`). An npm registry `E404` only means a package name was not found during that check; it does **not** guarantee reservation rights, npm similarity/anti-typosquatting clearance at publish time, trademark rights, or scope ownership (such as `@blendops` or `@thanhnguyxn`).

---

## Release policy

- v0 should not depend on official marketplace acceptance.
- v0 can ship GitHub, project-local, docs-only, and manual install guidance.
- Marketplace publishing is a later, evidence-gated distribution option.
- Do not claim official marketplace listing until the listing is actually published and verified.
- Do not claim broad install confidence until multiple target surfaces have install and rollback evidence.

---

## Runtime boundary

Distribution strategy does not change runtime strategy.

- Public runtime guidance uses **2 MCP execution paths plus a CLI fallback appendix** (replaces older 3-stack and 4-route drafts — see [`./runtime-stack-strategy.md`](./runtime-stack-strategy.md)):
  1. **Path 1 — Official Blender Lab MCP** (Lab add-on + Lab server installed in Blender 5.1+, hosted from either (a) Anthropic Blender Connector in Claude Desktop, or (b) any other MCP client configured manually).
  2. **Path 2 — Community `mcp-for-blender`** (mature third-party, Blender 3.0+).
  3. **CLI fallback (appendix)** — direct `blender --background --python`. **Documented upstream** as a first-class Blender CLI surface; no in-repo evidence file yet.
- Anthropic Connector is **not** standalone. Anthropic's tutorial step 2 explicitly tells you to install the Lab MCP add-on inside Blender. The Connector is the Claude-Desktop-specific MCP host on top of the Lab stack.
- Path 2 (`mcp-for-blender`) is mature prior art. Caveats live in [`./unofficial-runtime-bridges.md`](./unofficial-runtime-bridges.md).
- Blender runtime setup is separate from BlendOps skill/law/pack distribution.
- Runtime artifacts still require eval evidence before any claim.
- Full official runtime manual eval remains Not Run until the eval packet is executed and evidence is recorded.

---

## What this strategy does not do

- It does not submit BlendOps to a marketplace.
- It does not publish a package.
- It does not create a release.
- It does not install Blender.
- It does not configure a runtime bridge.
- It does not create or claim preview/render/GLB artifacts.
- It does not introduce a BlendOps-owned custom runtime implementation.
