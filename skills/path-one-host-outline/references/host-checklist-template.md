# Path 1 Host Checklist Template

Use this step-by-step verification template when outlining **Path 1 (Official Blender Lab MCP)** for either host option **(a) Anthropic Blender Connector** or **(b) Manual MCP client** (Claude Code, Cursor, Codex, OpenCode, Cline, Continue, Zed, Windsurf, etc.). Remember the Blender **5.1+** floor applies specifically to the Lab add-on manifest.

```txt
Path 1 Host Outline — Official Blender Lab MCP
=============================================
1) Blender Executable Floor:
   - Required for Path 1: Blender 5.1+ (Lab add-on manifest requirement)
   - Detected / planned version: <e.g. Blender 5.2.3 LTS | Not checked yet>

2) Blender-Side Lab MCP Add-on (MANDATORY before host setup):
   - Installed Blender Lab MCP add-on inside Blender Preferences? [Yes | Pending user step]
   - Add-on enabled and local server started inside Blender session? [Yes | Pending user step]
   - Note: Anthropic Blender Connector is NOT standalone — step 2 is required even for Host (a).

3) Host Wiring (choose exactly one active host):
   - Host (a) Anthropic Blender Connector -> Follow Anthropic's official connector setup AFTER step 2
   - Host (b) Manual MCP Client -> Follow `docs/install/<target>.md` and point client config to Lab MCP server

4) Single-Bridge Sanity Check:
   - Confirm community `mcp-for-blender` (Path 2) is disabled/unloaded and port 9876 has no conflicting bridge.
   - If dual-bridge suspected -> stop and invoke `bridge-conflicts`.

5) Initial Read-Only Verification:
   - Run one non-mutating inspection check (`get_scene_info` / `blendops runtime doctor`) before creating or editing meshes.

Truth Status:
  Runtime status: Not Run (until live tool output captured)
  Artifact status: Not Produced
  Source docs: docs/runtime-stack-strategy.md, docs/external-runtime-setup.md
```

## Related skill
[../SKILL.md](../SKILL.md)
