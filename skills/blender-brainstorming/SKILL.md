---
name: blender-brainstorming
description: Socratic exploration of a non-Blender-user's 3D intent before scene planning. Use when the request is vague, has multiple plausible interpretations, or needs creative scoping.
---

# blender-brainstorming

## Purpose

Run a structured Socratic brainstorming pass on a vague non-Blender-user 3D request before any scene planner, runtime readiness, or evidence skill is invoked. Surface the user's actual intent, missing constraints, and decision points so downstream skills do not waste effort on the wrong direction.

Inspired by the `/brainstorming` skill in Anthropic Superpowers, adapted for the Blender / non-Blender-user domain.

## Quick start

- ask 3-5 minimum clarifying questions
- propose 2-3 alternative scopings
- end with a one-paragraph intent summary the user can confirm
- hand off to `intent-to-3d-brief-writer` once intent is confirmed

## When to use

- the user request is short, ambiguous, or missing critical context (subject, mood, deliverable, evidence expectations)
- multiple plausible interpretations exist (e.g. "make me a cool product render" — what product, what mood, web or print, GLB or render?)
- the user is non-Blender-technical and may not realize what BlendOps must know to plan well
- before any planner skill (`product-hero-scene-planner`, `blender-composition-camera-planner`, …)

## When not to use

- the user already provided a structured brief (jump straight to `intent-to-3d-brief-writer` or planners)
- the user explicitly asked to skip clarification
- runtime is already configured and the user wants execution, not planning

## Trigger phrases

- "I want a 3D render of..." (vague)
- "Make me something cool with..."
- "Help me plan a Blender scene" (no constraints given)
- "I'm not sure what I want exactly..."
- "Brainstorm with me about..."

## Prerequisites / readiness

- ability to ask the user questions in turn
- no Blender runtime required
- works in text-only mode

## Input schema

### Required inputs

- the original user request (verbatim)
- target deliverable hint if any (image / GLB / web hero / iteration loop)

### Optional inputs

- existing references (mood boards, brand color hints)
- known performance / time / scope constraints
- target audience for the final output

### Assumptions to confirm

- the user has time for a 3-5 question clarification round
- the user wants a structured plan, not a one-shot guess
- runtime status is `Not Run` and may stay so

## Output schema

### Primary output

- one-paragraph confirmed intent summary
- explicit list of decisions taken vs. deferred

### Secondary output

- list of clarification questions asked + user answers
- 2-3 alternative scopings considered (and why one was chosen)

### Evidence / caveat output

- any unresolved ambiguity flagged as a blocker for the next skill
- explicit statement that no Blender execution happened

## Required laws

- ../../laws/non-blender-user-language.md
- ../../laws/evidence-before-done.md
- ../../laws/no-arbitrary-python-interface.md
- ../../laws/official-runtime-only.md

## Official runtime boundary

This skill does not install Blender, run Blender, or configure any MCP path. It is text-only conversation.

If the user pushes for execution during brainstorming, route to `official-runtime-readiness-checker` and do not attempt runtime work from this skill.

## Operating procedure

1. Read the user's original request verbatim. Do not paraphrase yet.
2. Identify the 5 minimum facts a planner needs: subject, mood, deliverable type (render/GLB/handoff), audience, evidence expectations.
3. For each missing fact, write one short question. Ask all questions in one batch (don't drip-feed).
4. After answers, propose 2-3 alternative scopings (e.g. "minimal hero render" vs. "full web-ready GLB" vs. "iteration-friendly text-only plan").
5. Ask the user to pick one scoping or to combine two.
6. Write a one-paragraph intent summary in plain language (no Blender jargon).
7. Echo any unresolved ambiguity as an explicit blocker.
8. Hand off to `intent-to-3d-brief-writer` (recommended) or directly to `product-hero-scene-planner` if the brief is simple.

## Decision tree

- request is short and one-line → ask all 5 minimum-fact questions in one turn.
- request has 2 of 5 minimum facts → ask only the missing 3.
- request has 4-5 of 5 facts → skip brainstorming; route directly to brief writer.
- user refuses to answer → record assumptions explicitly and hand off with `verified-read: low` confidence label.

## Playbooks

- Playbook A: "Vague creative request" — full 5-question pass, 3 alternative scopings.
- Playbook B: "Half-specified request" — targeted 1-3 questions, 2 alternative scopings.
- Playbook C: "User refuses clarification" — record explicit assumptions, low-confidence handoff.

## Mode handling

### Text-only mode

- conversation only, no runtime calls
- runtime status: `Not Run`
- artifact status: `Not Produced`

### Runtime-ready mode

- not applicable; brainstorming is always text-only
- if user wants execution, route to readiness checker first

### Blocked runtime mode

- still runs (brainstorming has no runtime dependency)
- note that downstream planner / runtime steps are blocked

## Validation checklist

- [ ] original user request quoted verbatim
- [ ] 3-5 clarifying questions asked
- [ ] 2-3 alternative scopings proposed
- [ ] user-confirmed intent summary produced
- [ ] decisions taken vs. deferred listed explicitly
- [ ] runtime status remains `Not Run`
- [ ] no Blender jargon in user-facing summary
- [ ] handoff target named (`intent-to-3d-brief-writer` or planner)
- [ ] no clarification question implies BlendOps installs Blender or runs it
- [ ] unresolved ambiguity flagged as blocker if present

## Pass / Warn / Fail rubric

| Category | Pass | Warn | Fail |
|---|---|---|---|
| Clarification depth | 3-5 targeted questions | Fewer questions but explicit assumption notes | No questions, jumped to plan |
| Alternative scopings | 2-3 distinct scopings | 1 scoping with caveats | 0 alternatives offered |
| Intent summary | Plain-language, ≤5 sentences, user-confirmed | Plain-language but unconfirmed | Jargon-heavy or absent |
| Handoff | Named next skill, evidence-bound | Named next skill, missing caveat | No handoff |

## Failure handling

- user gives one-word answers: ask one focused follow-up, then proceed with explicit assumption notes.
- user contradicts themselves: surface the contradiction, ask which version to keep.
- user wants execution mid-brainstorm: pause brainstorming, route to readiness checker, return after readiness is known.

## Troubleshooting

- if the user keeps adding scope, summarize current scope and ask "should we lock this scope or keep expanding?".
- if you can't form a 5-fact intent after 5 questions, hand off with explicit `Unknown` status on missing facts.

## Best practices

- ask questions in batches, not one at a time
- propose alternatives the user might not have considered
- confirm intent before handoff (user reads summary, says "yes/no")

## Good examples

- "User asked: 'Make me a cool sneaker render.' Brainstorming surfaces: cyberpunk vs. minimalist mood; web GLB vs. marketing render; iteration vs. one-shot. User picks cyberpunk + web GLB. Intent locked."

## Bad examples

- "User asked vague request. Skipping brainstorming and jumping straight to scene planner with assumed parameters." (overclaim risk; user will be surprised)

## User-facing response template

- What I heard you ask for (quote)
- What I need to know (3-5 questions)
- Alternative ways we could scope this (2-3 options)
- Confirmed intent (one paragraph after answers)
- Decisions deferred (explicit list)
- What I'll do next (handoff to brief writer or planner)

## Anti-patterns

- asking 1 question at a time (drip-feed) instead of batched
- skipping alternative scopings
- using Blender jargon in the intent summary
- claiming the brainstorming session "set up" Blender or "installed" anything

## Cross-skill handoff

- After: `intent-to-3d-brief-writer` (recommended) or directly `product-hero-scene-planner` if brief is trivial
- If user wants execution: `official-runtime-readiness-checker`
- If runtime blocked: `non-blender-user-response-writer` to explain status

## Non-goals

- runtime setup
- artifact production
- deciding the final scene plan (that's the planner's job)
- one-shot interpretation of vague requests

## References

- Inspired by Anthropic Superpowers `/brainstorming` skill (https://github.com/anthropics/skills)
- BlendOps law: ../../laws/non-blender-user-language.md
- BlendOps law: ../../laws/evidence-before-done.md
- Skill system: ../../docs/skill-system.md
