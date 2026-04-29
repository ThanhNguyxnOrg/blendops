# Recipe: cyberpunk-shoe-hero

Status: Draft v0

## User prompt

“Create a cyberpunk shoe web hero with a floating shoe, neon lights, glossy dark floor, cinematic camera, export GLB, and give web usage guidance.”

## Assumptions

- User is non-Blender-technical.
- Runtime setup follows official runtime options only.
- Output needs both visual quality and web handoff clarity.

## Clarification questions

1. Is this optimized for realtime web, marketing visuals, or both?
2. Do you already have a source shoe model/reference?
3. Any required brand colors or forbidden motifs?
4. Preferred camera framing (square/wide/custom)?
5. Any performance constraints for web delivery?

## Scene intent

- Hero focus: floating shoe as central subject
- Mood: cyberpunk neon ambiance
- Surface context: glossy dark floor for reflection cues
- Output intent: web-ready GLB with explanation

## Composition plan

- subject hierarchy: shoe > support elements > background
- framing: cinematic 3/4 emphasis
- negative space reserved for hero text overlays (if needed)

## Lighting plan

- key light for silhouette readability
- neon accent/rim lighting for cyberpunk mood
- controlled reflections on glossy floor

## Material plan

- stylized-but-readable product material definition
- reflective floor tuned for contrast, not clutter
- portability awareness for export/handoff

## Camera plan

- hero camera angle fixed before final quality gate
- lens/framing chosen for product emphasis

## Official runtime assumptions

- Official Blender MCP Server: https://www.blender.org/lab/mcp-server/
- Official Claude Blender Connector: https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
- Official Blender CLI docs: https://docs.blender.org/manual/en/latest/advanced/command_line/index.html

Source confidence note:
- keep `verified-read` vs `linked-only` explicit at runtime setup step.

## Validation checklist

- [ ] subject clarity
- [ ] composition coherence
- [ ] scale plausibility
- [ ] camera/framing intent
- [ ] lighting readability
- [ ] material consistency
- [ ] render/preview readiness
- [ ] export readiness
- [ ] web handoff caveat transparency

## Artifact handoff checklist

- [ ] GLB artifact status documented
- [ ] preview artifact status documented
- [ ] assumptions/caveats documented
- [ ] next-step runtime checks documented

## Non-Blender-user final response template

- **What you asked for:** concise restatement
- **What is ready now:** pass/warn/fail summary
- **What needs follow-up:** unresolved checks and impact
- **What to do next:** prioritized actions in plain language

## Failure/caveat examples

Example A (partial):
- “Scene intent and quality checks are mostly ready, but web runtime compatibility is not fully verified yet. Status: Conditionally Ready.”

Example B (not ready):
- “Official runtime setup evidence is incomplete, so export-readiness cannot be confirmed. Status: Not Ready.”
