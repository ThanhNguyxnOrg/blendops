# Pack Prerequisite Matrix

Score every prerequisite row **`Ready`**, **`Needs input`**, or **`Blocked`** before starting a pack workflow.

| Area | Verification Questions | Critical Gate? | Route If Incomplete |
|---|---|---|---|
| **Goal & Brief Lock** | Subject dimensions, key visual mood, camera targets, and consumer pipeline locked in `intent-to-3d-brief-writer`? | **YES (Execution)** | `blender-brainstorming` → `intent-to-3d-brief-writer` |
| **Deliverables Priority** | Still (`PNG`/`EXR`), turntable, animated rig, and/or `.glb` web targets ranked (`Must` vs `Nice`)? | **YES (Execution)** | `output-format-decision` / `resolution-aspect-decision` |
| **Asset & License Plan** | Procedural vs external library vs kitbash decided, with license & style checks scheduled? | **YES (External Assets)** | `asset-discovery` → `asset-license-checker` |
| **Quality & Color Gates** | Poly/texture budgets, PBR sanity, and View Transform (`AgX` vs `Khronos PBR Neutral`) pinned? | Optional for early rough draft; **YES before export** | `polycount-budget-checker` / `color-management-decision` |
| **Runtime Posture** | Path 1 (`Lab MCP 5.1+`, Host a/b), Path 2 (`mcp-for-blender 3.0+`), or CLI fallback stated explicitly? Connector never standalone. | Conditional (`Needs input` OK in pure planning mode) | `runtime-path-picker` → `runtime-setup` |
| **Single-Bridge Invariant** | Confirmed Path 1 and Path 2 are **not** concurrently enabled inside the same Blender session? | **YES (Runtime)** | `bridge-conflicts` |
| **Evidence Discipline** | Stakeholder agrees `Not Run` / `Not Produced` stay default until concrete evidence files exist? | **YES (Always)** | `laws/evidence-before-done.md` |

## Gate Verdict Rule
- Any **`Blocked`** critical row stops downstream execution planning until resolved (`blocked-start-playbook.md`).
- Pure planning workflows may advance with Runtime Posture = `Needs input`, provided all outputs remain explicitly labeled `Runtime status: Not Run`.

## Related skill
- [SKILL.md](../SKILL.md)
