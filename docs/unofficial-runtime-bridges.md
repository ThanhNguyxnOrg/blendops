# Unofficial Runtime Bridges

Status: Optional / Unofficial / User-managed / Experimental-local / Not part of the official BlendOps runtime path / Not used for release-readiness claims

> [!CAUTION]
> This page is caveat-only guidance for users who knowingly choose an unofficial bridge. It is **not official Blender tooling**, **not part of the BlendOps official runtime path**, **not used for Draft v0 release-readiness claims**, and **not a substitute for the official runtime manual eval**.

BlendOps public runtime guidance uses the 3-stack model in [runtime-stack-strategy.md](./runtime-stack-strategy.md):

1. Stack 1 — Claude Desktop official connector stack.
2. Stack 2 — Official Blender CLI fallback.
3. Stack 3 — Optional unofficial third-party MCP stack.

This page documents Stack 3 caveats only. Use [external-runtime-setup.md](./external-runtime-setup.md), [reference-runtime.md](./reference-runtime.md), and [runtime-stack-strategy.md](./runtime-stack-strategy.md) for the authoritative BlendOps runtime posture.

---

## Purpose

Some users do not use Claude Desktop or cannot get an official runtime path working in their local environment. They may ask about an optional bridge such as [ahujasid/blender-mcp](https://github.com/ahujasid/blender-mcp).

That repository is a **third-party MCP bridge**, not made by Blender, not owned by BlendOps, and not validated by BlendOps. Treat any use as experimental, local, and user-managed.

---

## Runtime bridge model

A third-party bridge usually has separate moving parts:

| Layer | Example responsibility |
|---|---|
| MCP client/host | Claude Code, OpenCode, Cursor, VS Code, Claude Desktop, or another MCP-capable tool. |
| MCP server | A third-party Blender MCP server process, such as the server from `ahujasid/blender-mcp`. |
| Blender-side add-on/session bridge | An add-on or local socket/session bridge running inside Blender. |
| Blender app/session | The actual Blender process and open scene. |

All layers must be compatible and connected before a user should expect Blender tools to work.

---

## Per-client configuration

Each MCP-capable client needs its own configuration.

- Claude Desktop config does **not** automatically configure Claude Code, OpenCode, Cursor, or VS Code.
- Claude Code, OpenCode, Cursor, and VS Code must each be configured separately if the user wants Blender tools in that client.
- The Blender-side add-on or session bridge must also be installed, running, and connected for the selected client session.
- Avoid running multiple Blender MCP servers against the same Blender session unless the upstream bridge explicitly says that is safe.

---

## High-level setup guidance only

This doc does not copy the upstream tutorial and does not make third-party setup part of BlendOps install.

If you choose an unofficial bridge anyway:

1. Read the upstream README and terms first.
2. Install any required package manager only if you accept the upstream requirements.
3. Configure the MCP server in the chosen MCP client.
4. Install the Blender-side add-on exactly as instructed upstream.
5. Start or connect the Blender-side bridge for the current Blender session.
6. Run a read-only scene/session summary test first.
7. Attempt scene mutation only after the read-only connection test works and you understand the risks.

Example upstream wording may mention `uvx blender-mcp`. Treat that as a third-party command from the upstream project, not as a BlendOps command or official runtime requirement.

---

## Safety notes

Third-party runtime bridges may expose powerful operations inside Blender.

Before use:

- Inspect the upstream repository, issue history, license, terms, telemetry behavior, and security posture.
- Assume arbitrary Python or code execution inside Blender may be possible if the bridge exposes scripting tools.
- Avoid important Blender files for first tests; use disposable scenes.
- Disable telemetry if desired and if supported upstream.
- Avoid running multiple Blender MCP servers at once unless the upstream bridge says it is safe.
- Do not claim preview, render, GLB, or Blender artifacts without generated evidence.
- Record failures, caveats, prompts, actions, and generated file paths if you later use a bridge experimentally.

---

## BlendOps boundary

BlendOps can still provide:

- workflow plans
- validation gates
- artifact truth rules
- user-facing handoff language
- safety and evidence expectations

BlendOps does **not** own, ship, support, audit, maintain, or validate a third-party MCP bridge. A run through a community MCP or other third-party MCP bridge must be labeled experimental/local and must not be counted as an official runtime eval or as release-eval evidence.

Do not treat an unofficial bridge run as release-readiness evidence for Draft v0 unless a future release policy explicitly creates a separate, non-official evidence category.
