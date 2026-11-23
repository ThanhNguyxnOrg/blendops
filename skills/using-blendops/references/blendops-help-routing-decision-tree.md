# Routing Decision Tree

When the user's intent is unclear, walk this tree top-down. Stop at the first matching condition and load the named skill.

```
1. Is the user's request VAGUE or has multiple plausible interpretations?
   YES → load `scoping-3d-briefs` (Socratic exploration first).
   NO  → continue to 2.

2. Is intent confirmed but no STRUCTURED BRIEF exists yet?
   YES → load `scoping-3d-briefs` (8-slot brief).
   NO  → continue to 3.

3. Are SCENE ASSETS not trivially given (e.g. "a shoe" without a model)?
   YES → load `sourcing-assets` (per-asset strategy).
   NO  → continue to 4.

4. Does the user want to RUN BLENDER right now?
   YES → load `setting-up-blender-runtime` first.
         If readiness reports inconsistent signals → `setting-up-blender-runtime`.
         If readiness reports Blocked / Unknown    → `setting-up-blender-runtime`.
   NO  → continue to 5.

5. Is the user asking for a SCENE / COMPOSITION / LIGHTING / MATERIAL plan?
   Scene plan      → `planning-product-scenes`
   Composition     → `planning-camera-and-framing`
   Lighting/material → `planning-lighting-and-materials`
   Quality gate    → `verifying-before-handoff`

6. Has output ALREADY EXISTED but it looks WRONG?
   YES → load `troubleshooting-blender-output` (4-phase root-cause).

7. Is there a render / GLB / preview to CLASSIFY for evidence?
   YES → load `verifying-before-handoff`.

8. Is a DELIVERABLE about to be HANDED OFF as "ready"?
   YES → load `verifying-before-handoff` (7-point gate). Never skip.

9. Is the deliverable a GLB or web asset that needs HANDOFF FRAMING?
   YES → load `handing-off-glb-to-web` (caveats + R3F snippets).

10. Does the user need a PLAIN-LANGUAGE SUMMARY for non-Blender stakeholders?
    YES → load `using-blendops` (final response).
```

## Multi-skill chains

Most real workflows chain 4-7 skills. Common chains:

| Chain | Skills in order |
|---|---|
| First-time user, vague request | `scoping-3d-briefs` → `scoping-3d-briefs` → `sourcing-assets` → planners → quality gate → evidence → verification → response |
| Iteration on existing scene | `troubleshooting-blender-output` → relevant planner → quality gate → evidence → verification → response |
| Pre-release verification | `verifying-before-handoff` → (downgrade if needed) → response |
| Runtime conflict triage | `setting-up-blender-runtime` → `setting-up-blender-runtime` → readiness re-check |

See `docs/workflows/full-non-blender-user-workflow.md` for the full canonical chain.
