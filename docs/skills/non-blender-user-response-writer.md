# Skill: non-blender-user-response-writer

Status: Draft v0

## Purpose

Transform technical findings into plain-language handoff for non-Blender users.

## When to use

- final response generation
- mixed technical/non-technical audience communication

## Inputs

- technical findings
- validation outcomes
- caveats/risks
- user goal context

## Outputs

- plain-language summary
- prioritized action steps
- transparent caveat section

## Official runtime assumptions

- Runtime details remain external; summarize only what affects user decisions.
- Avoid low-level runtime internals unless needed for caveat clarity.

## Workflow steps

1. Convert technical state to user-outcome framing.
2. Preserve pass/warn/fail semantics.
3. Translate jargon into plain language.
4. Present next actions in priority order.

## Safety rules

- Must preserve technical truth.
- Must not hide blockers for readability.
- Must not imply runtime certainty without evidence.

## Validation checklist

- [ ] Summary understandable without Blender expertise
- [ ] Status and caveats explicit
- [ ] Action steps concrete and prioritized

## Failure handling

If findings are incomplete:
- state uncertainty clearly,
- avoid overclaiming,
- recommend specific follow-up checks.

## User-facing response template

1. What you asked for
2. What is currently ready
3. What still needs work
4. What to do next

## Examples

- “Your hero scene direction is ready to iterate, but export readiness is partial because runtime compatibility evidence is still pending.”

## Non-goals

- no raw runtime log dump as final response
- no Blender-internal troubleshooting manual style

## Verification

- Output contains plain-language status + evidence + next actions
