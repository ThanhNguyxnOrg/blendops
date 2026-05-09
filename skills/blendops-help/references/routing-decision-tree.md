# Routing Decision Tree

When the user's intent is unclear, walk this tree top-down. Stop at the first matching condition and load the named skill.

```
1. Is the user's request VAGUE or has multiple plausible interpretations?
   YES → load `blender-brainstorming` (Socratic exploration first).
   NO  → continue to 2.

2. Is intent confirmed but no STRUCTURED BRIEF exists yet?
   YES → load `intent-to-3d-brief-writer` (8-slot brief).
   NO  → continue to 3.

3. Are SCENE ASSETS not trivially given (e.g. "a shoe" without a model)?
   YES → load `blender-asset-discovery-planner` (per-asset strategy).
   NO  → continue to 4.

4. Does the user want to RUN BLENDER right now?
   YES → load `official-runtime-readiness-checker` first.
         If readiness reports inconsistent signals → `runtime-bridge-conflict-resolver`.
         If readiness reports Blocked / Unknown    → `official-runtime-setup-guide`.
   NO  → continue to 5.

5. Is the user asking for a SCENE / COMPOSITION / LIGHTING / MATERIAL plan?
   Scene plan      → `product-hero-scene-planner`
   Composition     → `blender-composition-camera-planner`
   Lighting/material → `blender-lighting-material-planner`
   Quality gate    → `blender-scene-quality-checker`

6. Has output ALREADY EXISTED but it looks WRONG?
   YES → load `blender-troubleshooting` (4-phase root-cause).

7. Is there a render / GLB / preview to CLASSIFY for evidence?
   YES → load `render-export-evidence`.

8. Is a DELIVERABLE about to be HANDED OFF as "ready"?
   YES → load `pre-handoff-verification` (7-point gate). Never skip.

9. Is the deliverable a GLB or web asset that needs HANDOFF FRAMING?
   YES → load `glb-web-handoff` (caveats + R3F snippets).

10. Does the user need a PLAIN-LANGUAGE SUMMARY for non-Blender stakeholders?
    YES → load `non-blender-user-response-writer` (final response).
```

## Multi-skill chains

Most real workflows chain 4-7 skills. Common chains:

| Chain | Skills in order |
|---|---|
| First-time user, vague request | `blender-brainstorming` → `intent-to-3d-brief-writer` → `blender-asset-discovery-planner` → planners → quality gate → evidence → verification → response |
| Iteration on existing scene | `blender-troubleshooting` → relevant planner → quality gate → evidence → verification → response |
| Pre-release verification | `pre-handoff-verification` → (downgrade if needed) → response |
| Runtime conflict triage | `official-runtime-readiness-checker` → `runtime-bridge-conflict-resolver` → readiness re-check |

See `docs/workflows/full-non-blender-user-workflow.md` for the full canonical chain.
