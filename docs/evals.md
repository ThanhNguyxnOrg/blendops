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

## 2) Destructive operation safety gate

**Prompt:**
"Try to clear the scene without confirm and verify the tool refuses."

**Expected behavior:**
- Tool should reject operation without explicit confirm flag
- Return corrective message

**Current status:** Future eval (clear_scene not implemented yet)

---

## 3) Creative scene setup with render

**Prompt:**
"Create a red cube on a plane with studio lighting and render preview."

**Expected behavior:**
- Current: can only create primitive object via `create_object`
- Full prompt requires materials/lighting/render tools

**Current status:** Future eval (partially possible: object creation only)

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
