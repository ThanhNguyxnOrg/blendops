# BlendOps Skill Acceptance Criteria

Status: Draft v0

## Draft v0 checklist

A skill is Draft v0 when:
- required structure sections exist
- official runtime boundary is explicit
- no non-official runtime setup path appears
- evidence-before-done language is present
- non-Blender-user response pattern is present
- at least one text-only eval prompt exists

## Active v0 checklist

A skill can be considered Active v0 when:
- all review gates are passed or warnings are explicitly accepted
- text-only eval has documented pass/warn/fail result
- runtime eval path and blocker handling are documented
- pack integration and links are validated
- no banned patterns appear

## Banned patterns

- claiming runtime success without evidence
- claiming preview/render/GLB exists without evidence
- non-official runtime setup instructions in active skill content
- arbitrary Python as final user-facing interface
- monolithic cross-domain skill that ignores handoff/gate composition

## Required evidence/caveat wording

- status must include evidence state
- unresolved checks must be listed
- unknowns must be explicit
- next action must be concrete

## Acceptable examples

- “Status: Conditionally Ready. Runtime artifacts are Not Run in this pass.”
- “Official runtime references are linked; setup details deferred to upstream docs.”

## Unacceptable examples

- “Export succeeded.” (without artifact evidence)
- “Runtime is configured.” (without checks)
- “Use non-official MCP fallback for setup.”
