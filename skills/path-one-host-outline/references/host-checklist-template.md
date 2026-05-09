# Host checklist template

```txt
Path 1 host outline

1) Blender executable installed (version plan: ___ ; Path 1 needs 5.1+)
2) Lab MCP add-on installed + enabled inside Blender (Blender-side step — required)
3) Lab MCP server reachable from chosen host
4) Host wiring:
   - (a) Anthropic Blender Connector flow — follow official Anthropic tutorial AFTER step 2
   - (b) Manual MCP client — follow `docs/install/<target>.md` for your agent
5) Single-bridge verification — ensure Path 2 bridge not concurrently attached

Evidence expectations:
Runtime status: Not Run (until user attempts)
Next docs: docs/runtime-stack-strategy.md, docs/external-runtime-setup.md, per-target install doc
```
