# Evidence Examples

## Purpose
Show concrete examples of acceptable versus unacceptable runtime evidence when `runtime-readiness` evaluates whether Blender and a chosen bridge (`Path 1`, `Path 2`, or `CLI fallback`) are genuinely ready.

## When to use
- Whenever auditing a readiness claim before transitioning from `Not Run` to `Attempted` or `Verified`.

## Acceptable vs. Unacceptable Evidence

| Check Target | Unacceptable Claim (Reject -> Keep `Not Run`) | Acceptable Observed Evidence (Verify) |
|---|---|---|
| **Blender Executable Version** | `"User probably has Blender installed in Program Files."` | `"Command \`blender --version\` returned: Blender 5.2.3 (build date 2026-09-10). Meets Path 1 5.1+ floor."` |
| **Path 1 Lab MCP Add-on** | `"Anthropic Connector is enabled in Claude Desktop so Blender works."` | `"Blender Preferences -> Add-ons confirms Blender Lab MCP add-on enabled, listening on local transport; host (a)/(b) paired."` |
| **Path 2 Community Bridge** | `"mcp-for-blender installed somewhere."` | `"ahujasid/mcp-for-blender add-on active inside Blender 4.2.1 on port 9876; Path 1 Lab add-on verified disabled."` |
| **MCP Client Config / Doctor** | `"Cursor should see the MCP server."` | `"Executed \`blendops runtime doctor --json\`: config path exists, 0 bridge conflicts, read-only \`get_scene_info\` returned object count 3."` |
| **Fallback Handling** | `"Failed to connect, trying anyway."` | `"Connection refused on port 9876 -> recorded \`Runtime status: Failed\`, halted scene mutation, routed to \`runtime-attempt-report\`."` |

## Verification Rule
- Only cite versions, file paths, and command outputs **directly observed in this session**. Unobserved steps remain `Not Run` (`Artifact status: Not Produced`).

## Related skill
[../SKILL.md](../SKILL.md)
