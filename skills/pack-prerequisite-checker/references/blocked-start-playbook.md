# Blocked Start Playbook

## Purpose
Prevent downstream planning or execution skills from wasting work or assuming unverified facts when pack prerequisites fail. Every `Blocked` gate routes cleanly to one specific remediation skill and stops further progression.

## Blocker Routing Playbook

| Blocked Prerequisite Area | Symptoms / Missing Evidence | Immediate Stop Action | Route Next To | Minimum Unlock Condition |
|---|---|---|---|---|
| **Incomplete Brief / Ambiguous Subject** | Missing deliverable format, target platform, or unclarified hero subject | Halt all scene, camera, lighting, and recipe planning | `intent-to-3d-brief-writer` (or `blender-brainstorming` if scope itself unclear) | All required brief slots populated (`Subject`, `Outputs`, `Constraints`) |
| **Runtime Unknown on Execution Request** | User asks to render, mutate `.blend`, or export `.glb` right now without selected path | Refuse runtime commands; mark `Runtime status: Not Run` | `runtime-path-picker` -> `runtime-setup` -> `runtime-readiness` | Explicit path (`Path 1` / `Path 2` / `CLI fallback`) selected and verified |
| **Unverified Asset / Stock Licenses** | External meshes, HDRIs, or textures planned for commercial release with missing license terms | Block asset import / pack handoff; flag commercial risk | `asset-license-checker` | Every external asset tagged (`CC0`, `CC-BY` attribution recorded, or custom-made) |
| **Conflicting Deliverables / Scope Creep** | User demands `4K Cycles film + <1MB mobile GLB + 6 animations` simultaneously with no priority | Freeze planning; surface exact budget/pipeline contradiction | `scope-guard` | Explicit `P0` primary deliverable locked; incompatible asks deferred to Phase 2 |
| **Dual-Bridge / Port `9876` Collision** | Path 1 Lab MCP and Path 2 `mcp-for-blender` both enabled, or stale socket occupies `9876` | Block MCP commands immediately to avoid split-brain scene edits | `bridge-conflicts` | Exactly one active bridge verified running on clean host configuration |

## Non-Bypass Policy
- Never downgrade a `Blocked` gate to `Ready` based on verbal assumptions ("user probably has Blender 5.1+").
- When switching to **planning-only mode** (`Runtime status: Not Run`, `Artifact status: Not Produced`), document runtime absence honestly as `Not Run (planning-only)` instead of pretending execution is unblocked.

## Related skill
[../SKILL.md](../SKILL.md)
