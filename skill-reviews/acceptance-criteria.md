# BlendOps Skill Acceptance Criteria

Status: Draft v0

## Draft v0 checklist

A skill is Draft v0 when:
- required structure sections exist
- runtime boundary is explicit in 2-path + CLI appendix terms
- Path 2 appears only with third-party caveats; CLI appendix is never a peer path
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
- Path 2 setup without third-party caveats in active skill content
- describing the Anthropic Connector as standalone
- applying the Blender 5.1+ floor to Path 2 or CLI
- presenting CLI fallback as a peer execution path without an eval record
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
- “Use Path 2 without caveats for setup.”
