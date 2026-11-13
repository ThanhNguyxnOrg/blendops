# Setup Summary Template

## Purpose
Standardize the final summary emitted by `runtime-setup` so non-Blender users see which path was chosen, what is verified on disk vs. linked-only, and one exact next step — without mixing up canonical truth states.

## When to use
- At the conclusion of `runtime-setup` or whenever updating setup posture after checking a user's MCP host config.

## Canonical Output Template
```txt
Selected runtime path: <Path 1 (Lab MCP: Host a Connector / Host b Manual) | Path 2 (Community mcp-for-blender) | CLI Fallback (blender --background --python)>
Blender version floor: <5.1+ for Path 1 | 3.0+ for Path 2 | Upstream CLI surface>
Source confidence: <verified-read | linked-only | mixed>

What is verified locally (observed in this pass):
  - <e.g. docs/install/cursor.md read; no conflicting Path 2 bridge found in workspace config>

What remains unverified / linked-only:
  - <e.g. Blender executable version not yet checked on host; Lab MCP add-on toggle inside Blender UI pending user click>

Required single next step:
  - <e.g. Install + enable Blender Lab MCP add-on inside Blender Preferences, then run a read-only connection check>

Runtime status: <Not Run | Attempted | Produced | Verified | Failed>
Artifact status: <Not Produced | Produced | Verified | Failed>
```

## Good vs. Bad Rules
- **Good**: Uses only the 5 canonical runtime truth states (`Not Run`, `Attempted`, `Produced`, `Verified`, `Failed`) and marks `Artifact status: Not Produced` during setup.
- **Bad**: Claims `"Setup complete, Blender ready to render!"` when no Blender process or MCP handshake was actually observed.

## Related skill
[../SKILL.md](../SKILL.md)
