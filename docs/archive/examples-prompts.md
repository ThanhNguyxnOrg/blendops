# Example AI Agent Prompts for BlendOps

These prompts can be used to test BlendOps with AI agents like Claude.

---

## Basic Scene Creation

```
Create a red cube on a plane with studio lighting and render a preview.
```

**Expected Operations:**
1. `scene.clear` (if needed)
2. `object.create` (plane)
3. `object.create` (cube)
4. `material.create` (red material)
5. `material.apply` (to cube)
6. `lighting.setup` (studio preset)
7. `render.preview`

---

## Scene Inspection & Export

```
Inspect this scene and tell me what can be exported as a game asset.
```

**Expected Operations:**
1. `scene.inspect`
2. `validate.scene` (game-asset preset)
3. Analysis of validation results
4. Recommendations for fixes

---

## Low-Poly Asset Creation

```
Create a low-poly treasure chest style blockout and export as GLB.
```

**Expected Operations:**
1. `object.create` (multiple primitives)
2. `object.transform` (positioning)
3. `material.create` (basic materials)
4. `material.apply`
5. `validate.scene` (game-asset preset)
6. `export.asset` (GLB format)

---

## Validation & Fixes

```
Validate the scene and suggest fixes for game asset export.
```

**Expected Operations:**
1. `scene.inspect`
2. `validate.scene` (game-asset preset)
3. Analysis of warnings
4. Suggested corrective operations

---

## Product Photography Setup

```
Set up a product photography scene with proper lighting for a small object.
```

**Expected Operations:**
1. `lighting.setup` (studio or custom)
2. `camera.set` (target object, distance)
3. `render.preview`
4. Adjustments based on preview

---

## Complex Workflow

```
Create a simple game level blockout:
- Ground plane (10x10)
- 3 crates at different positions
- A ramp connecting two platforms
- Studio lighting
- Validate for game export
- Export as GLB
```

**Expected Operations:**
1. `scene.clear`
2. Multiple `object.create` calls
3. Multiple `object.transform` calls
4. `material.create` and `material.apply`
5. `lighting.setup`
6. `validate.scene`
7. `export.asset`

---

## Error Recovery

```
Try to create an object with an invalid name, then fix it.
```

**Expected Operations:**
1. `object.create` (with invalid name)
2. Receive error with corrective message
3. `object.create` (with valid name)

---

## Undo Workflow

```
Create a cube, move it, then undo the move operation.
```

**Expected Operations:**
1. `object.create`
2. `object.transform`
3. `undo.last`
4. `scene.inspect` (verify undo)

---

## Notes for Testing

- All prompts should work without arbitrary Python execution
- Responses should include structured JSON with corrective errors
- Destructive operations should require confirmation
- Validation should provide actionable feedback
