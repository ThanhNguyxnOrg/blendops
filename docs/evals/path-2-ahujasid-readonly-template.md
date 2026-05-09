# Path 2 Read-Only Smoke Test (ahujasid/blender-mcp) — Template

Status: **Template only / Not Yet Run** — copy this file to `path-2-ahujasid-readonly-YYYY-MM-DD.md`, fill in every field below, change Status to `Pass / Available` or `Failed` based on what actually happened, then add a row to [`README.md`](./README.md) "Evidence and result index".

Date filled: <YYYY-MM-DD>  
Operator: <name or handle>  
Runtime path: **Path 2 — Community Blender MCP (`ahujasid/blender-mcp`)** — see [`docs/runtime-stack-strategy.md`](../runtime-stack-strategy.md)  
Scope: Read-only smoke test only. Mutation, render, and export must remain `Not Run`.

> [!CAUTION]
> A successful run of this template **only** upgrades Path 2 read-only access from "User-reported verified" to "Verified". It does **not** upgrade mutation, render, export, or artifact evidence. For those, run the [official runtime manual eval packet](./official-runtime-manual-eval-packet.md) and save a separate `path-2-ahujasid-recipe-cyberpunk-shoe-YYYY-MM-DD.md` evidence file.

---

## 1. Identity (fill all 6)

| Field | Value | Required |
|---|---|---|
| `blender --version` (verbatim) |  | yes |
| Blender install path (e.g. `/Applications/Blender.app/Contents/MacOS/Blender` or `C:\Program Files\Blender Foundation\Blender 4.5\blender.exe`) |  | yes |
| `ahujasid/blender-mcp` `addon.py` upstream commit SHA (from the file you installed in Blender) |  | yes |
| `uvx blender-mcp` version (output of `uvx blender-mcp --version` if available, otherwise the package version `uv pip list \| grep blender-mcp`) |  | yes |
| MCP host product + version (Claude Desktop / Claude Code / Cursor / Codex / OpenCode / Cline / VS Code / other) |  | yes |
| MCP host config snippet that registered the server |  | yes |

Example for the last field (Claude Desktop):

```json
{
  "mcpServers": {
    "blender": {
      "command": "uvx",
      "args": ["blender-mcp"]
    }
  }
}
```

---

## 2. Single-bridge constraint check (fill all 4)

| Check | Status |
|---|---|
| Lab MCP add-on (`bpype/blender_mcp`) is **not** running concurrently against the same Blender instance | Pass / Fail |
| Anthropic Blender Connector is **not** also enabled for the same Blender session | Pass / Fail |
| At most one MCP host is connected at a time | Pass / Fail |
| Local bridge port (commonly `localhost:9876`) is not already taken by another process | Pass / Fail |

> [!IMPORTANT]
> Blender accepts a single MCP bridge session per Blender instance. If Path 1 (Lab MCP) and Path 2 (`ahujasid/blender-mcp`) are both configured, the second connection silently fails. Prove the single-bridge constraint here.

---

## 3. Read-only tools called (fill 1+ rows)

Path 2 tool surface includes `get_scene_info`, `execute_blender_code` (read-only mode), viewport screenshot, optional Hyper3D / Hunyuan3D / Poly Haven / Sketchfab integrations.

For this template, only call **read-only** tools. **Do not** call `execute_blender_code` with anything that mutates the scene.

| # | Tool name | Arguments (summary) | Response status | Response payload (summary) |
|---|---|---|---|---|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |

Recommended minimum: 1 call to `get_scene_info` and confirm it returns scene name + object list.

---

## 4. No-mutation guarantee (fill all 5)

| Guarantee | Status | Evidence |
|---|---|---|
| No `execute_blender_code` was called with mutating Python (no `bpy.ops.*` that creates / deletes / modifies / saves) | Pass / Fail | List of tool calls reviewed |
| No render was triggered | Pass / Fail | Render output folder unchanged |
| No GLB export was triggered | Pass / Fail | Export output folder unchanged |
| No `.blend` file save | Pass / Fail | File timestamp unchanged |
| Viewport screenshot, if taken, did not write to a path outside `~/Downloads` or a documented eval output folder | Pass / Fail | Screenshot path |

---

## 5. Session data observed (paste verbatim)

```txt
<paste the get_scene_info response or equivalent>
```

| Field | Value |
|---|---|
| Filepath |  |
| Saved | true / false |
| Dirty | true / false |
| Scene name |  |
| Active workspace |  |
| Active object |  |
| Mode |  |
| Render engine |  |

Objects returned:

| Object | Type | Visibility |
|---|---|---|
|  |  |  |

---

## 6. Result boundary (fill the verdict)

This smoke test only upgrades Path 2 read-only access. Set the verdict and confirm what it does NOT upgrade:

```txt
Path 2 (ahujasid/blender-mcp) read-only access: Pass / Available    ← change if the test failed
Path 2 mutation / render / export eval: Not Run                     ← keep this verbatim
Path 1 (Lab MCP): unchanged by this record (still smoke-only)       ← keep verbatim
CLI fallback: unchanged by this record (publisher not verified)     ← keep verbatim
Full official runtime manual eval: Not Run
Runtime artifacts: Not Produced
Stable release readiness: Not Ready
v0.1.0 tag: <update only after both paths have full eval evidence OR the limitation is documented>
```

---

## 7. Caveats / observations (free text)

<!-- Note any unexpected behavior, prompts that surprised you, port conflicts, sandbox warnings, telemetry behavior, or anything else a future operator should know. -->

---

## 8. After saving this file

- [ ] Rename this copy from `path-2-ahujasid-readonly-template.md` to `path-2-ahujasid-readonly-YYYY-MM-DD.md`.
- [ ] Add a row to [`docs/evals/README.md`](./README.md) "Evidence and result index" pointing at the new file.
- [ ] Update the verdict in [`docs/evals/README.md`](./README.md) "Verdict dashboard" Path 2 row from "User-reported verified" to "Verified" if the smoke test passed.
- [ ] Update [`docs/release-readiness.md`](../release-readiness.md) status row for Path 2.
- [ ] Update [`docs/release-readiness-rollup-v0.md`](../release-readiness-rollup-v0.md) Path 2 verification status.
- [ ] Update [`docs/runtime-stack-strategy.md`](../runtime-stack-strategy.md) "BlendOps verification" cell for Path 2.
- [ ] Update [`README.md`](../../README.md) badge for Path 2 if appropriate.
- [ ] Run `npm run docs:check` and `npm run skills:export` to confirm no CI break.
- [ ] Commit with message `Add Path 2 (ahujasid/blender-mcp) read-only smoke evidence YYYY-MM-DD`.

---

## What this template does NOT do

- Does **not** install Blender.
- Does **not** install `uv` or `ahujasid/blender-mcp` for you.
- Does **not** configure an MCP client.
- Does **not** prove mutation, render, export, or GLB success.
- Does **not** authorize tagging `v0.1.0`. That requires either a full eval record OR an explicit documented limitation acceptance.
