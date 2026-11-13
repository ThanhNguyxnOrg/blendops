# Scope Gap Rules

Use these objective thresholds in `recipe-fit-assessor` to score whether an existing BlendOps recipe/pack is a **Strong**, **Partial**, or **Poor** fit for the user's request. Every downgraded gap must name one concrete mitigation.

## Fit Rating Matrix

| Verdict | Criteria Required | Allowed Next Routing |
|---|---|---|
| **Strong Fit** | Deliverable type (`still`, `turntable`, `.glb`, `animation`), visual style (studio vs. dark hero vs. environment), asset sourcing feasibility, and complexity all align with an existing recipe/pack | Proceed directly to `pack-prerequisite-checker` or `intent-to-3d-brief-writer` |
| **Partial Fit** | Core staging/camera structure fits an existing recipe, **but** 1-2 constraints conflict (e.g., extra mobile GLB budget, extra animation pass, or unverified external asset licenses) | Route through `scope-guard` or `asset-license-checker` to resolve gaps before planning |
| **Poor Fit** | Fundamental pipeline mismatch — recipe cannot safely stretch to cover the core requirement without inventing an unsupported multi-scene/rig/simulation pipeline | Decline pack shortcut honestly; decompose via `blender-recipe-decomposer` or custom planner (`character-portrait`, `environment-shot`, `interior-scene`) |

## Explicit Upgrade & Downgrade Triggers
- **Upgrade to Strong Fit** when: deliverable matches pack outputs 1:1, polycount/texture complexity fits stated timeline, and lighting/staging style matches the chosen playbook (`product-hero-playbooks.md`).
- **Downgrade to Partial Fit** when:
  1. User asks for incompatible targets simultaneously (`4K cinematic Cycles animation + <1.5 MB mobile AR GLB`) with no `P0` priority.
  2. External branded logos/characters are required while the recipe assumes clean procedural/CC0 geometry (`asset-license-checker` needed).
  3. Interactive R3F/Three.js handoff is requested on top of a still-only recipe (pair with `glb-web-handoff` + `web-material-simplification.md`).
- **Trigger Poor Fit** when:
  1. User needs full rigged character animation or photoreal architectural interior lighting while inspecting a product-hero studio pack.
  2. Request requires multi-user real-time collaborative editing or Blender server hosting (explicitly outside BlendOps Draft v0 scope).

## Documentation Rule
- Every `Partial` or `Poor` finding must output bulleted `[Gap] -> [Mitigation / Recommended Skill]` pairs rather than silent workarounds.

## Related skill
[../SKILL.md](../SKILL.md)
