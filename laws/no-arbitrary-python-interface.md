# Law: no-arbitrary-python-interface

Status: Draft v0

## Purpose
Prevent arbitrary-code style final interfaces in user-facing BlendOps outputs.

This law governs the product surface, not execution sandboxing: it bans "paste this Python" as the user-facing flow, but it does not cover operator-side sandbox hygiene (trusted environment, secrets handling). Sandbox guidance lives in `official-runtime-readiness-checker` and `runtime-attempt-report-writer`.

## Applies to
All skills/workflows/pack outputs.

## Must do
- keep outputs workflow- and validation-driven
- keep runtime execution external and evidence-bound

## Must not do
- must not present arbitrary Python execution as final user interface
- must not bypass law/validation gates with opaque low-level execution guidance

## Blocking conditions
- output recommends arbitrary-code interface as normal user flow

## Validation
- user-facing output is intent-first and constrained
- caveats are explicit when runtime certainty is missing

## Good example
“BlendOps provides a structured plan and checks; runtime execution remains external.”

## Bad example
“Paste and run arbitrary Python as the default BlendOps flow.”
