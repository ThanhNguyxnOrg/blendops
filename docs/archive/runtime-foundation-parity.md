# Runtime Foundation Parity

This document compares runtime foundations across:

- **Official Blender CLI** (runtime primitive)
- **ahujasid/blender-mcp** (prior art)
- **BlendOps minimal foundation** (current product scope)

| Capability | Official Blender CLI | ahujasid/blender-mcp | BlendOps minimal foundation | Action |
|---|---|---|---|---|
| Blender launch | Native `blender` process launch flags and modes | Addon + MCP workflow; user-managed startup pattern | Managed bridge lifecycle built on Blender runtime behavior | KEEP |
| GUI/background mode | Supports GUI and `--background` execution | Primarily interactive addon workflow with MCP control | Supports gui/background bridge start; GUI emphasized for validated runtime path | KEEP + document mode limits |
| addon/bootstrap | `--python <script>` bootstrap possible | Addon is core bridge component | Managed startup script + addon registration flow | KEEP |
| MCP startup | Not provided by Blender CLI itself | Provided by MCP server component | `apps/mcp-server` entrypoint with typed tools | KEEP |
| AI client config | External concern; user config required | Provides MCP setup patterns | Provides MCP setup docs and entrypoint guidance | KEEP |
| readiness/status | No built-in BlendOps-style readiness envelope | Operational status implied through MCP/addon connection | Structured `bridge.status` with readiness metadata | KEEP |
| logs | Terminal/stdout-stderr from Blender run | Server/addon logs per implementation | `bridge logs` + lifecycle log files + structured guidance | KEEP |
| tool list / operation discoverability | N/A | Tool list exposed through MCP server | `bridge.operations` + `list_operations` / `bridge operations` | KEEP |
| scene inspect | Possible via custom script | Supported | `scene.inspect` / `inspect_scene` typed operation | KEEP |
| minimal object create | Possible via custom script | Supported | `object.create` / `create_object` typed operation | KEEP |
| request correlation (`request_id`/`receipt`) | Not a native Blender CLI envelope concept | Varies by implementation | First-class response envelope semantics | KEEP |
| stop/cleanup | Process lifecycle managed by caller | Addon/server lifecycle managed by project | `bridge stop` + tracked process state + guarded cleanup | KEEP |
| error handling | Raw process/script errors unless wrapped | Project-specific; broad capability surface | Structured typed responses with warnings/next_steps | KEEP |
| safety posture | Depends entirely on caller scripts | Includes arbitrary code execution surface | No arbitrary Python endpoint in foundation promise | KEEP (strict) |

## Notes

- BlendOps relies on official Blender CLI/runtime behavior for process orchestration, not replacement.
- `ahujasid/blender-mcp` remains a useful architecture/reference benchmark, not a code copy target.
- BlendOps focuses on predictable typed boundaries and workflow safety for non-Blender users.
