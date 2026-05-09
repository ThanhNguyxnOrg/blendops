# Common Symptom Playbooks

Pre-canned diagnostic patterns for the 5 most common Blender output divergences. Use these when Phase 1 reproduction is locked.

## Playbook 1: "Render came out fully black"

- Phase 2 narrow: strip every prompt detail except subject + camera. Re-render.
- Phase 3 likely root causes (rank by evidence):
  1. Lighting plan missing key light.
  2. Camera occluded by hidden geometry.
  3. World HDRI not enabled in render settings.
  4. Render engine mismatch (Eevee vs Cycles render-time vs viewport).
- Phase 4 fix: route to `blender-lighting-material-planner`. Pass criteria: re-render shows visible key-light contribution.

## Playbook 2: "GLB is empty / mis-scaled / fails web import"

- Phase 2 narrow: open the GLB in [gltf.report](https://gltf.report) or `gltf-validator`. Check geometry, scale, materials.
- Phase 3 likely root causes:
  1. Export plan filtered out the hero geometry (selection-only flag).
  2. Scale unit mismatch (Blender meters vs glTF meters).
  3. Material non-portable (procedural shader baked-out missing).
  4. Wrong forward axis.
- Phase 4 fix: route to `glb-web-handoff`. Pass criteria: GLB opens in target viewer, shows hero geometry, scale correct.

## Playbook 3: "Final response uses Blender jargon"

- Phase 2 narrow: highlight every jargon term in the response.
- Phase 3 likely root causes:
  1. Response writer received raw plan dump without translation step.
  2. Plan itself contained jargon (upstream).
- Phase 4 fix: route to `non-blender-user-response-writer`. Pass criteria: response readable to a non-Blender user with no follow-up clarifications.

## Playbook 4: "Recipe blocked despite recent smoke pass"

- Phase 2 narrow: list configured MCP servers per client + Blender-side add-ons.
- Phase 3 likely root causes:
  1. Path 1 + Path 2 both running (Single-bridge constraint violated).
  2. Two MCP clients targeting same Blender.
  3. Port collision (commonly `localhost:9876`).
  4. Anthropic Connector + manual `mcpServers.blender` both ON (both Path 1 host options targeting same Lab stack).
- Phase 4 fix: route to `runtime-bridge-conflict-resolver`. Pass criteria: bridge state matrix shows exactly one active path.

## Playbook 5: "Output exists but doesn't match brief"

- Phase 2 narrow: compare brief slot-by-slot against output. Find first mismatched slot.
- Phase 3 likely root causes (depends on which slot):
  - Subject mismatch → planner overrode the brief.
  - Mood mismatch → lighting planner.
  - Deliverable mismatch → handoff skill.
  - Acceptance failure → quality checker missed a check.
- Phase 4 fix: route to the earliest mismatched slot's owning skill. Pass criteria: re-run produces output matching the slot.
