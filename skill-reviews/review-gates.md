# BlendOps Skill Review Gates

Status: Draft v0

## Gate 0 — Source/license review
- no copied code/docs from external repos
- references and summarized learnings only
- external inspiration must be structural, not verbatim

## Gate 1 — Official runtime boundary
- Official Blender MCP Server
- Official Claude Blender Connector
- Official Blender CLI docs
- no non-official MCP active path
- no custom runtime ownership claims

## Gate 2 — Law compliance
- official-runtime-only
- no-arbitrary-python-interface
- evidence-before-done
- non-blender-user-language

## Gate 3 — Skill depth/format compliance
Each skill must include:
- frontmatter
- purpose
- when to use
- when not to use
- trigger phrases
- prerequisites/readiness
- inputs
- outputs
- required laws
- official runtime boundary
- operating procedure
- mode handling
- validation checklist
- pass/warn/fail rubric
- failure handling
- troubleshooting
- best practices
- examples
- anti-patterns
- cross-skill handoff
- non-goals
- references

## Gate 4 — Blender workflow quality
- composition/camera quality logic
- lighting/material quality logic
- scale/transform awareness
- render/export readiness logic
- GLB/web handoff quality where relevant

## Gate 5 — Evidence and artifact truth
- no preview/render/GLB claim without evidence
- text-only mode labeled
- runtime-ready mode labeled
- blocked runtime mode labeled
- artifact status required (`Produced`, `Not Produced`, `Not Run`)

## Gate 6 — Non-Blender-user UX
- plain language first
- no jargon overload
- caveats preserved
- next actions clear

## Gate 7 — Pack consistency
- skill appears in `skills/README.md`
- pack manifest includes skill when in pack scope
- laws/skills cross-links are valid
- no broken relative links

## Gate 8 — Eval readiness
- text-only eval prompt exists
- runtime eval blockers can be recorded
- pass/warn/fail result is possible

## Gate usage
A skill should not be promoted beyond Draft v0 unless all gates are explicitly reviewed and any warnings are documented.
