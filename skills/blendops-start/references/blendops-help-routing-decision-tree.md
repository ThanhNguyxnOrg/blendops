# Routing Decision Tree

When the user's intent is unclear, walk this tree top-down. Stop at the first matching condition and load the named skill.

```
1. Is the user's request VAGUE or has multiple plausible interpretations?
   YES → load `blendops-brief` (Socratic exploration first).
   NO  → continue to 2.

2. Is intent confirmed but no STRUCTURED BRIEF exists yet?
   YES → load `blendops-brief` (8-slot brief).
   NO  → continue to 3.

3. Are SCENE ASSETS not trivially given (e.g. "a shoe" without a model)?
   YES → load `blendops-assets` (per-asset strategy).
   NO  → continue to 4.

4. Does the user want to RUN BLENDER right now?
   YES → load `blendops-connect-blender` first.
         If readiness reports inconsistent signals → `blendops-connect-blender`.
         If readiness reports Blocked / Unknown    → `blendops-connect-blender`.
   NO  → continue to 5.

5. Is the user asking for a SCENE / COMPOSITION / LIGHTING / MATERIAL plan?
   Scene plan      → `blendops-product-shot`
   Composition     → `blendops-camera`
   Lighting/material → `blendops-lighting-materials`
   Quality gate    → `blendops-final-check`

6. Has output ALREADY EXISTED but it looks WRONG?
   YES → load `blendops-fix-problems` (4-phase root-cause).

7. Is there a render / GLB / preview to CLASSIFY for evidence?
   YES → load `blendops-final-check`.

8. Is a DELIVERABLE about to be HANDED OFF as "ready"?
   YES → load `blendops-final-check` (7-point gate). Never skip.

9. Is the deliverable a GLB or web asset that needs HANDOFF FRAMING?
   YES → load `blendops-glb-web-handoff` (caveats + R3F snippets).

10. Does the user need a PLAIN-LANGUAGE SUMMARY for non-Blender stakeholders?
    YES → load `blendops-start` (final response).
```

## Multi-skill chains

Most real workflows chain 4-7 skills. Common chains:

| Chain | Skills in order |
|---|---|
| First-time user, vague request | `blendops-brief` → `blendops-assets` → planners → quality gate → evidence → verification → response |
| Iteration on existing scene | `blendops-fix-problems` → relevant planner → quality gate → evidence → verification → response |
| Pre-release verification | `blendops-final-check` → (downgrade if needed) → response |
| Runtime conflict triage | `blendops-connect-blender` → readiness re-check |

See `docs/workflows/full-non-blender-user-workflow.md` for the full canonical chain.
