# Anti-Patterns — Runtime Path Selection

Stop immediately and correct course if any of these appear in a plan or reply:

| Anti-pattern | Why it breaks | Required correction |
|---|---|---|
| **Standalone Connector myth** | Anthropic's official setup explicitly requires installing the Blender Lab MCP add-on inside Blender before the Connector works. | Present Connector strictly as Path 1 host option `(a)` alongside the Lab add-on prerequisite. |
| **Path 1 version bleed (`5.1+` everywhere)** | The `5.1.0` floor comes from the Lab add-on manifest only. Claiming Path 2 or `blender --background` needs 5.1+ misleads Blender 3.x/4.x users. | Scope `Blender 5.1+` strictly to Path 1; keep Path 2 at `3.0+` and CLI version-matched. |
| **Dual active bridges on one Blender instance** | Binding Path 1 Lab MCP and Path 2 `mcp-for-blender` (port `9876`) in the same session causes port conflicts and state drift. | Stop and route to `bridge-conflicts` before attempting any tool call. |
| **Dismissing CLI appendix as unsupported** | Upstream Blender documents `--background --python` as a first-class CLI surface; BlendOps simply has `Not Run` in-repo eval evidence for it today. | Frame CLI accurately as upstream-documented with `Not Run` in-repo evidence. |
| **Assuming IT/sandbox permission** | Choosing Path 1 or Path 2 does not guarantee local firewall, socket, or extension permissions succeed. | Keep `Runtime status: Not Run` until live probes return observed tool output. |

## Related skill
- [SKILL.md](../SKILL.md)
