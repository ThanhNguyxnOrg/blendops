# Law: non-blender-user-language

Status: Draft v0

## Purpose
Ensure user-facing outputs remain understandable for non-Blender users.

## Applies to
All final summaries and user-facing response templates.

## Must do
- use plain language first
- explain unavoidable technical terms briefly
- provide clear next actions

## Must not do
- must not rely on dense Blender jargon
- must not present raw runtime logs as final explanation

## Blocking conditions
- user-facing output cannot be understood without Blender internals

## Validation
- summary is plain-language
- caveats and status are clear
- next actions are actionable

## Good example
“Runtime was not executed yet, so artifact status is Not Run.”

## Bad example
“Deferred pipeline tangent-space mismatch requires shader graph remediation.”
