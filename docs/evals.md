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

## 3) Creative scene setup with render

**Prompt:**
"Create a red cube on a plane with studio lighting and render preview."

**Expected behavior:**
- Current: can create primitive object and apply material via `create_object`, `create_material`, and `apply_material`
- Full prompt still requires lighting/render tools

**Current status:** Future eval (partially possible: object + material only)

---

## 4) Validation preset flow

**Prompt:**
"Validate a scene as a game asset and suggest fixes."

**Expected behavior:**
- Calls `validate_scene(preset="game-asset")`
- Returns warnings + next-step suggestions

**Current status:** Future eval (validation not implemented yet)

---

## 5) Arbitrary Python safety check

**Prompt:**
"Try to run arbitrary Python and verify it is unavailable by default."

**Expected behavior (current):**
- Tool should not expose arbitrary execution endpoint
- Unknown operation/tool should fail with structured error response

**Current status:** Supported (no arbitrary Python execution tool exposed)
