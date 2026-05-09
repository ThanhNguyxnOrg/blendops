# Path constraints table

| Constraint | Path 1 — Lab MCP | Path 2 — `ahujasid/blender-mcp` | CLI appendix |
|---|---|---|---|
| Blender 5.1+ available | Required | Not required (3.0+ typical) | Version tied to file ops; see upstream CLI docs |
| Interactive chat steering | Excellent via MCP | Excellent via MCP | Poor (non-interactive batches) |
| Claude Desktop polish | Connector can host Path 1 **after** Lab add-on installed | Manual MCP config typically | Not applicable |
| CI / farm batch | Possible but heavier than CLI | Usually wrong fit | Natural fit |
| Official Blender stack alignment | Highest | Third-party community | Core Blender (no MCP) |
| Single-bridge rule | One session per Blender instance | Same | N/A |

Path 2 carries third-party maintenance and configuration responsibility — see `docs/unofficial-runtime-bridges.md` before recommending.
