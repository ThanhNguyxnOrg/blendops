# Golden Path — Cyberpunk Shoe Web Hero

## Purpose

Define the first useful non-Blender-user BlendOps experience as a product/workflow specification (not implementation code).

This golden path is for users who can describe a creative goal in plain language and want web-ready 3D outputs without understanding Blender internals.

---

## User story

As a non-Blender user,
I want to ask an AI coding tool to create a cyberpunk shoe web hero scene,
so I can receive a usable GLB asset, preview evidence, and plain-language web integration guidance.

Example prompt:

> “Create a cyberpunk shoe web hero with a floating shoe, neon lights, glossy dark floor, cinematic camera, export GLB, and give me web usage guidance.”

---

## Target user assumptions

- User does not know Blender UI, scene graph concepts, material node editing, or render pipeline details.
- User can describe creative intent and constraints in natural language.
- User expects outcome-oriented results (asset + guidance), not tool-internal logs.
- User may not distinguish between runtime layers (AI tool, BlendOps workflow layer, Blender runtime bridge).
- User expects safety and clarity when something fails.

---

## Desired final output

BlendOps should enable an AI tool to return:

1. **Plain-language result summary**
   - What was requested
   - What was produced
   - What quality caveats apply

2. **Artifact bundle (or explicit failure report)**
   - Exported GLB for web use (or explicit reason it was not produced)
   - One or more preview outputs where available
   - Minimal metadata for handoff (file list, target scale/unit note, known limitations)

3. **Validation report**
   - Requested intent checklist vs observed outcome
   - Pass/partial/fail state with rationale

4. **Web usage guidance**
   - Practical integration notes for web/app usage
   - Suggested next steps for iteration if quality is insufficient

---

## AI interaction flow (product-level)

1. **Intent capture**
   - Parse creative request, use-case target, and required deliverables.

2. **Constraint clarification (only if needed)**
   - Ask focused follow-ups when required inputs are missing or contradictory.

3. **Scene/workflow planning**
   - Produce a structured, non-Blender-jargon plan (subject, composition, lighting, materials, camera, export intent, validation checks).

4. **Runtime execution plan**
   - Route to external runtime assumptions (official Blender CLI + reference bridge pattern), without exposing raw runtime complexity to end user.

5. **Validation**
   - Compare output against original intent and explicit acceptance checks.

6. **Handoff response**
   - Return artifacts/evidence, caveats, and clear web usage guidance in non-Blender language.

---

## Clarification questions AI may ask

AI should ask only questions that unblock successful output quality or prevent ambiguous execution. Suggested question set:

1. **Primary output priority**: Is the GLB for real-time web use, marketing render quality, or both?
2. **Shoe source**: Should the shoe be generated procedurally/conceptually, or do you provide a source model/reference asset?
3. **Visual tone**: More realistic/product-photo style or stylized/cinematic cyberpunk?
4. **Brand/style constraints**: Any required colors, logo usage, or forbidden visual elements?
5. **Camera framing**: Square hero, widescreen hero, or specific focal composition?
6. **Performance target**: Any poly/texture/performance constraints for web delivery?
7. **Background requirement**: Transparent background, dark stage, or full environment?
8. **Preview preference**: Static preview only, turntable preview, or both when available?

Clarification policy:
- Ask minimum required questions.
- If user declines details, proceed with explicit assumptions and state them.

---

## Scene planning steps

1. **Intent normalization**
   - Convert natural-language request into structured scene objectives.

2. **Composition plan**
   - Floating shoe position, camera angle, focal emphasis, negative space for hero text overlays.

3. **Lighting plan**
   - Neon accent lights, key/fill/rim intent, reflections on glossy floor.

4. **Material/shading plan**
   - Shoe material treatment and dark-floor gloss response consistent with cyberpunk mood.

5. **Environment/background plan**
   - Minimal environment supporting hero focus without clutter.

6. **Export plan**
   - GLB output and preview output expectations.

7. **Validation plan**
   - Predefined checks mapped to request (floating subject, neon mood, cinematic framing, export success).

---

## External runtime assumptions

BlendOps golden path assumes:

- **Official Blender CLI** is the runtime primitive for scene execution/export.
- **`ahujasid/blender-mcp`** is a reference external bridge pattern for AI↔Blender interaction.
- BlendOps does not claim to ship or clone a custom runtime in this phase.
- Runtime execution capabilities may vary by environment, Blender version, and bridge setup quality.
- Final user-facing language must stay workflow-oriented; do not expose raw low-level operational steps unless needed for failure explanation.

---

## Validation criteria

A run is evaluated against these criteria:

1. **Intent alignment**
   - Output reflects requested scene concept (cyberpunk shoe hero).

2. **Visual feature coverage**
   - Floating shoe present
   - Neon lighting mood present
   - Glossy dark floor present
   - Cinematic camera framing present

3. **Artifact completeness**
   - GLB exported successfully, or explicit failure reason provided
   - Preview output produced where available, or explicit limitation stated

4. **Handoff clarity**
   - User receives plain-language summary and actionable web usage guidance.

5. **Transparency on caveats**
   - Any missing features, runtime constraints, or quality risks are clearly disclosed.

Status model:
- **Pass**: All required criteria met.
- **Partial**: Core output exists but one or more required criteria are missing or degraded.
- **Fail**: No usable artifact and/or intent not satisfied; response must include clear failure rationale and next-step recovery options.

---

## Expected artifacts

At minimum, expected handoff includes:

- `*.glb` target asset (or explicit failure report)
- preview image(s)/render(s) when available
- brief artifact manifest:
  - filename(s)
  - what each file is for
  - known caveats

Optional but recommended:
- short iteration recommendations for improving quality/performance

---

## Failure modes

Common failure modes to handle explicitly:

1. **Ambiguous creative request**
   - Not enough detail to infer composition/quality targets.

2. **Source asset mismatch or absence**
   - Requested shoe characteristics cannot be achieved with available inputs.

3. **Runtime export failure**
   - External runtime setup/export process fails before GLB output.

4. **Validation mismatch**
   - Export succeeds but visual intent criteria are not met.

5. **Web-readiness mismatch**
   - Output is technically produced but impractical for target web constraints.

Failure-response requirement:
- Explain what failed
- Explain likely cause in plain language
- Provide concrete next-step options (re-clarify, re-run with constraints, swap assumptions)

---

## Non-Blender-user final response format

BlendOps-driven AI responses should follow this structure:

1. **What you asked for**
   - One-paragraph restatement of user intent.

2. **What was produced**
   - Pass/Partial/Fail status
   - Artifact list with short purpose labels

3. **Validation against your request**
   - Checklist of requested scene elements with pass/fail indicators

4. **Web usage guidance**
   - How to use GLB in web/app context (high-level, practical)
   - Performance/quality caveats

5. **If anything failed or is incomplete**
   - Plain-language reason
   - Next best action options

Output language policy:
- Prefer plain language over Blender jargon.
- If technical terms are necessary, define them briefly.

---

## Out of scope for this document

- No code implementation
- No custom CLI/MCP/addon design
- No raw shell or arbitrary-Python user interface definition
- No React code in this phase
