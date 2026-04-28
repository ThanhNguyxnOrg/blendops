# 🧪 Runtime Smoke Test: Installability

Date: 2026-04-28

## Scope

Installability validation for source-based workflow (no npm publish):

- Local source install
- `npm link` command exposure
- Linked CLI command behavior
- MCP server path/config documentation
- Doctor/setup check behavior
- UAT baseline evidence

## 1) npm link result

Command:

```bash
npm link
```

Result:

- ✅ Succeeded (`up to date, audited 3 packages`)
- ✅ `blendops` command became available in shell

## 2) blendops --help result

Command:

```bash
blendops --help
```

Result:

- ✅ Printed full BlendOps CLI usage and command groups
- ✅ Includes bridge lifecycle, scene/object/material/camera/render/validate/export, undo, and batch operations

## 3) blendops bridge status result

Command:

```bash
blendops bridge status --verbose
```

Result:

- ✅ Command executed and returned structured JSON envelope
- When bridge is not running, response is expected:
  - `ok: false`
  - `operation: "bridge.error"`
  - message indicates bridge connection failure
  - includes actionable `next_steps`

Additional lifecycle validation was also executed through linked CLI:

```bash
blendops bridge start --mode gui --verbose
blendops bridge status --verbose
blendops bridge logs --tail 40
blendops bridge stop --verbose
```

Observed result:

- ✅ `bridge.start` completed successfully (~4101ms in observed run)
- ✅ `bridge.status` returned `ok` while running
- ✅ `bridge.stop` completed successfully

## 4) doctor/setup result

Command:

```bash
npm run doctor
```

Result:

- ✅ Node.js >= 18 check passed
- ✅ npm availability check passed
- ✅ Build artifact checks passed:
  - `apps/cli/dist/index.js`
  - `apps/mcp-server/dist/index.js`
- ✅ Blender path detection check passed
- ✅ Bridge status command invocation check passed (accepts structured response or expected bridge-down signal)

## 5) MCP config path checked

Verified docs and source path usage:

- ✅ `docs/mcp-setup.md` created with concrete examples
- ✅ Windows path documented:
  - `D:\Code\blendops\apps\mcp-server\dist\index.js`
- ✅ Cross-platform placeholder documented:
  - `/path/to/blendops/apps/mcp-server/dist/index.js`
- ✅ Claude Desktop / Claude Code and Cursor/generic MCP snippets included

## 6) UAT result

Evidence source:

- `.tmp/uat-full/summary.json`
- timestamp: `2026-04-28T11:50:54.3898185Z`

Summary:

- ✅ total_steps: 12
- ✅ passed: 12
- ✅ failed: 0
- ✅ all_passed: true
- ✅ total_elapsed_ms: 7452
- ✅ bridge-start elapsed_ms: 5167

## 7) Limitations

- `bridge status` without active bridge returns expected structured `bridge.error` response.
- Full runtime readiness for bridge-dependent operations still requires explicit bridge start (`blendops bridge start --mode gui --verbose`).
- UAT runtime evidence depends on local Blender availability and environment consistency.

## 8) Publish status

- ✅ No npm publish performed in this pass.
- ✅ Scope remained local/source installability and MCP configuration foundation.
