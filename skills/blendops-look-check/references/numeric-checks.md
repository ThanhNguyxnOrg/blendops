# Numeric checks

Run these before looking at any image. Vision models misjudge rotation, shape and size often (EditJudge-Bench measured 52–69% agreement with people), so a number that fails wins over an image that "looks fine".

Run the [scene state](scene-state.md) script with `PLAN` set from the locked scene plan. It only reads the scene; it never changes or saves it.

| Check | Fails when |
|---|---|
| `exists` | an object name in the plan is not in the scene |
| `extra_objects` | a visible mesh is in neither the plan nor `approved_extra` (meshes the user said yes to) |
| `size` | an object's size is more than 10% off the planned size (metres) |
| `scale_applied` | `scale` is not `(1, 1, 1)` |
| `geometry` | a planned mesh has no vertices after modifiers |
| `ground_contact` | the lowest vertex of a grounded object is more than 1 mm from the floor |
| `in_frame` | an object listed in `in_frame` is not fully inside the camera view; backdrops and approved crops are left out |
| `material` | a planned mesh has no material |
| `camera`, `light` | no active camera; a planned light is missing or has no energy |
| `engine`, `resolution` | the render settings differ from `output` |

The `warn` items (`floating`, `floating_parts`, `normals_inward`, `empty_material_slot`, ...) go to the visual review: confirm them in the pictures before you fix them.

Report the result as the round's `numeric_issues`; the script's `verdict` is the numeric verdict.
