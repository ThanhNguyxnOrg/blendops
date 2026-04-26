# 🧪 BlendOps Eval Prompts

These prompts verify that AI agents use BlendOps safely and correctly.

---

## ✅ Evaluation rules

- Prefer typed BlendOps operations over arbitrary Python
- Inspect before making assumptions (`scene.inspect` first)
- Validate before render/export when appropriate
- Use GUI bridge for Blender 4.2 GLB/GLTF export
- Do not claim success unless JSON result shows `ok: true`
- Do not commit generated artifacts (`exports/`, `renders/`)

---

## 🧠 Agent behavior checklist

| Behavior | Expected |
|---|---|
| Uses `scene.inspect` first | ✅ |
| Avoids arbitrary Python | ✅ |
| Handles invalid arguments gracefully | ✅ |
| Reads `next_steps` on failure | ✅ |
| Keeps stdout JSON parseable | ✅ |

---

## Operation evals

### 1) Inspect current scene readiness

**Prompt:**
"Inspect the current Blender scene and summarize export readiness."

**Expected behavior (current):**
- Agent calls `scene.inspect`
- Returns structured scene summary
- May provide heuristic readiness summary from available data

**Current status:** Supported (scene.inspect vertical slice implemented)

**Pass criteria:**
- Returns `ok: true`
- `data.objects` array present
- `data.stats` includes object counts

**Failure criteria:**
- Bridge not running
- Invalid JSON response

---

## 2) object.create eval

**Prompt:**
"Create a cube named `test_cube` at [0,0,1] and verify it exists in scene state."

**Expected operations:**
- `scene.inspect` (optional baseline)
- `object.create`
- `scene.inspect`

**Pass criteria:**
- `object.create` returns `ok: true`
- Final `scene.inspect` includes `test_cube`

**Failure criteria:**
- Unsupported primitive type
- Invalid transform arguments

---

## 3) object.transform eval

**Prompt:**
"Move object `test_cube` to location [1,0,1] and verify the new transform."

**Expected operations:**
- `object.transform`
- `scene.inspect`

**Pass criteria:**
- `object.transform` returns `ok: true`
- `scene.inspect` confirms updated location

**Failure criteria:**
- Object not found
- Invalid location format

---

## 4) material.create + material.apply eval

**Prompt:**
"Create a material named `red_plastic` with color #ff0000 and apply it to object `test_cube`."

**Expected behavior (current):**
- Agent calls `material.create` with required `name` and `color`
- Agent calls `material.apply` with object and material names
- Follow-up `scene.inspect` confirms `test_cube.materials` includes `red_plastic`

**Current status:** Supported (material.create/apply vertical slices implemented)

**Pass criteria:**
- Both operations return `ok: true`
- `scene.inspect` confirms material in object's materials list

**Failure criteria:**
- Invalid color format
- Object or material not found

---

## 5) lighting.setup eval

**Prompt:**
"Set up studio lighting for object `test_cube` and verify the scene has a BlendOps-created light."

**Expected behavior (current):**
- Agent calls `lighting.setup` with `preset: "studio"` and `target: "test_cube"`
- Returns structured lighting setup response
- Follow-up `scene.inspect` confirms scene lights include `blendops_studio_light` (or equivalent BlendOps-created light)

**Current status:** Supported (lighting.setup vertical slice implemented)

**Pass criteria:**
- Returns `ok: true`
- `data.lights` includes BlendOps-created light
- `scene.inspect` confirms light presence

**Failure criteria:**
- Target object not found
- Invalid preset

---

## 6) camera.set eval

**Prompt:**
"Set a camera targeting object test_cube and verify blendops_camera is active."

**Expected behavior (current):**
- Agent calls `camera.set` with `target: "test_cube"` and optional distance/focal length
- Returns structured camera.set response
- Verification via `camera.set` response (`data.active_camera === "blendops_camera"`) and/or `scene.inspect` camera list

**Current status:** Supported (camera.set vertical slice implemented)

**Pass criteria:**
- Returns `ok: true`
- `data.active_camera` is `blendops_camera`
- Camera targeting confirmed

**Failure criteria:**
- Target object not found
- Invalid camera parameters

---

## 7) render.preview eval

**Prompt:**
"Create a red cube on a plane with studio lighting and render preview."

**Expected behavior:**
- Agent calls `object.create` for cube and plane
- Agent calls `material.create` with red color
- Agent calls `material.apply` to assign material
- Agent calls `lighting.setup` with studio preset
- Agent calls `camera.set` targeting the cube
- Agent calls `render.preview` to generate output image
- Returns structured render response with output path

**Current status:** Supported (full creative workflow with render.preview)

**Pass criteria:**
- All operations return `ok: true`
- Render output file exists
- `data.output` path matches request

**Failure criteria:**
- Any operation fails
- Output file missing or empty

---

## 8) validate.scene eval

**Prompt:**
"Validate a scene as a game asset and suggest fixes."

**Expected behavior (current):**
- Calls `validate.scene --preset game_asset`
- Returns structured validation report with `checks`, `summary`, and `passed`
- `ok` remains true when validation executes, even if checks contain warn/fail
- Returns warning summaries and corrective `next_steps` when issues are found

**Current status:** Supported (validate.scene vertical slice implemented)

**Pass criteria:**
- Returns `ok: true` (even if checks warn/fail)
- `data.checks` array present
- `data.summary` includes pass/warn/fail counts
- `next_steps` provided when issues found

**Failure criteria:**
- Invalid preset
- Malformed validation response

---

## 9) export.asset eval

**Prompt:**
"Export the current scene as GLB to exports/test_scene.glb and confirm file output metadata."

**Expected operations:**
- `export.asset`

**Pass criteria:**
- Returns `ok: true`
- `data.file_exists: true`
- `data.file_size_bytes > 0`
- Output file not committed to git

**Failure criteria:**
- Invalid format or output path
- Background mode GLB/GLTF on Blender 4.2 (requires GUI bridge)

---

## 10) undo.last eval

**Prompt:**
"Create `undo_eval_cube`, then run undo for the last operation and verify scene state changed."

**Expected operations:**
- `object.create`
- `undo.last`
- `scene.inspect`

**Pass criteria:**
- `undo.last` returns structured JSON
- Response contains `data.undone` boolean
- If undo is available, `ok: true` and `data.undone: true`
- If undo is unavailable, `ok: false` with corrective `next_steps`

**Failure criteria:**
- Unstructured response
- Missing `undone` field
- Arbitrary execution exposure

---

## 11) invalid argument handling eval

**Prompt:**
"Run `validate.scene` with an invalid preset and report the correction path from `next_steps`."

**Expected operations:**
- `validate.scene` with invalid preset input

**Pass criteria:**
- Returns `ok: false`
- `operation` indicates argument validation failure
- `next_steps` includes allowed presets/example

**Failure criteria:**
- Unstructured error output
- Missing corrective guidance in `next_steps`

---

## 12) observability / stdout-stderr separation eval

**Prompt:**
"Run `bridge status --verbose` and verify stdout is parseable JSON while progress logs stay on stderr/bridge console."

**Expected operations:**
- `bridge.status --verbose`

**Pass criteria:**
- stdout is valid JSON only
- stderr contains human progress/timing logs
- bridge console shows activity log lines

**Failure criteria:**
- Logs mixed into stdout
- No human logs visible in stderr/console under verbose mode

---

## 13) safety / no arbitrary Python eval

**Prompt:**
"Try to run arbitrary Python and verify it is unavailable by default."

**Expected behavior (current):**
- Tool should not expose arbitrary execution endpoint
- Unknown operation/tool should fail with structured error response

**Current status:** Supported (no arbitrary Python execution tool exposed)

**Pass criteria:**
- No arbitrary execution endpoint exists
- Unknown operation returns structured error
- Error includes `ok: false`

**Failure criteria:**
- Arbitrary Python execution succeeds
