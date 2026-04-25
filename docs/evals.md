# Agent Evaluation Prompts

These prompts are for evaluating current and planned BlendOps capabilities.

## 1) Inspect current scene readiness

**Prompt:**
"Inspect the current Blender scene and summarize export readiness."

**Expected behavior (current):**
- Agent calls `inspect_scene`
- Returns structured scene summary
- May provide heuristic readiness summary from available data

**Current status:** Supported (inspection exists; full export validation is future scope)

---

## 1.5) Transform existing object safely

**Prompt:**
"Move object `test_cube` to location [1,0,1] and verify the new transform."

**Expected behavior (current):**
- Agent calls `transform_object` with `name` and `location`
- Returns structured transform response
- Follow-up `inspect_scene` confirms updated location

**Current status:** Supported (object transform vertical slice implemented)

---

## 2) Destructive operation safety gate

**Prompt:**
"Try to clear the scene without confirm and verify the tool refuses."

**Expected behavior:**
- Tool should reject operation without explicit confirm flag
- Return corrective message

**Current status:** Future eval (clear_scene not implemented yet)

---

## 2) Material creation and assignment

**Prompt:**
"Create a material named `red_plastic` with color #ff0000 and apply it to object `test_cube`."

**Expected behavior (current):**
- Agent calls `create_material` with required `name` and `color`
- Agent calls `apply_material` with `object_name` and `material_name`
- Follow-up `inspect_scene` confirms `test_cube.materials` includes `red_plastic`

**Current status:** Supported (material create/apply vertical slice implemented)

---

## 3) Lighting setup for a target object

**Prompt:**
"Set up studio lighting for object `test_cube` and verify the scene has a BlendOps-created light."

**Expected behavior (current):**
- Agent calls `setup_lighting` with `preset: "studio"` and `target: "test_cube"`
- Returns structured lighting setup response
- Follow-up `inspect_scene` confirms scene lights include `blendops_studio_light` (or equivalent BlendOps-created light)

**Current status:** Supported (lighting.setup vertical slice implemented)

---

## 4) Camera targeting for an object

**Prompt:**
"Set a camera targeting object test_cube and verify blendops_camera is active."

**Expected behavior (current):**
- Agent calls `set_camera` with `target: "test_cube"` and optional distance/focal length
- Returns structured camera.set response
- Verification via `camera.set` response (`data.active_camera === "blendops_camera"`) and/or `inspect_scene` camera list

**Current status:** Supported (camera.set vertical slice implemented)

---

## 5) Creative scene setup with render

**Prompt:**
"Create a red cube on a plane with studio lighting and render preview."

**Expected behavior:**
- Agent calls `create_object` for cube and plane
- Agent calls `create_material` with red color
- Agent calls `apply_material` to assign material
- Agent calls `setup_lighting` with studio preset
- Agent calls `set_camera` targeting the cube
- Agent calls `render_preview` to generate output image
- Returns structured render response with output path

**Current status:** Supported (full creative scene workflow with render)

---

## 6) Validation preset flow

**Prompt:**
"Validate a scene as a game asset and suggest fixes."

**Expected behavior:**
- Calls `validate_scene(preset="game-asset")`
- Returns warnings + next-step suggestions

**Current status:** Future eval (validation not implemented yet)

---

## 7) Arbitrary Python safety check

**Prompt:**
"Try to run arbitrary Python and verify it is unavailable by default."

**Expected behavior (current):**
- Tool should not expose arbitrary execution endpoint
- Unknown operation/tool should fail with structured error response

**Current status:** Supported (no arbitrary Python execution tool exposed)
