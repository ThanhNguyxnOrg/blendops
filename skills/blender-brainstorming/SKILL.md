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

- the user already provided a structured brief (route directly to `intent-to-3d-brief-writer` to lock the brief before any planner runs)
- the user explicitly asked to skip clarification (record explicit assumptions and route to `intent-to-3d-brief-writer`)
- the user pushes for immediate execution rather than exploration (route to `official-runtime-readiness-checker`)

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

- the user has time for a single 3-5 batched question clarification round
- the user wants a confirmed intent summary before brief locking and planning
- truth states are locked at `Runtime: Not Run` and `Artifact: Not Produced` (conversation-only; downgrade-only, never upgrade)

## Output schema

### Primary output

- user-confirmed one-paragraph intent summary in plain language (no Blender jargon)
- explicit list of decisions taken vs. deferred
- named handoff target (`intent-to-3d-brief-writer` to lock the brief, `official-runtime-readiness-checker` if execution is pushed, or `non-blender-user-response-writer` if blocked)

### Secondary output

- batched list of 3-5 clarifying questions asked + user answers
- 2-3 alternative scopings considered (and why one was chosen)

### Evidence / caveat output

- `Runtime: Not Run` | `Artifact: Not Produced` (downgrade-only, never upgrade)
- any unresolved ambiguity flagged as an explicit blocker for `intent-to-3d-brief-writer`
- explicit statement that this session is conversation-only and no Blender installation or execution happened

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
2. Identify the core facts needed downstream (subject, mood, deliverable type, audience, evidence expectations, and open creative constraints).
3. Formulate 3-5 short clarifying questions in plain language and ask all of them in a single batch (never drip-feed one question at a time).
4. Propose 2-3 distinct alternative scopings (e.g., "minimal hero image" vs. "interactive web-ready 3D model" vs. "iteration-friendly concept pass").
5. Ask the user to pick one scoping or combine elements, and confirm the resulting one-paragraph intent summary in plain language (no Blender jargon).
6. List decisions taken vs. deferred and record any remaining ambiguity as an explicit blocker.
7. Maintain `Runtime: Not Run` and `Artifact: Not Produced` (downgrade-only, never upgrade).
8. Hand off to `intent-to-3d-brief-writer` to lock the structured brief downstream before any planner skill is invoked (or route to `official-runtime-readiness-checker` if the user pushes for execution mid-brainstorm).

## Decision tree

- request is vague or missing key facts → ask 3-5 batched clarifying questions covering missing facts and creative trade-offs, then propose 2-3 alternative scopings.
- request is already a complete structured brief → skip brainstorming and route directly to `intent-to-3d-brief-writer`.
- user pushes for execution mid-brainstorm → pause brainstorming and route immediately to `official-runtime-readiness-checker`.
- user refuses to answer clarifying questions → record explicit assumptions and unresolved blockers, keep `Runtime: Not Run` and `Artifact: Not Produced` (never invent confidence labels), and hand off to `intent-to-3d-brief-writer`.

## Playbooks

- Playbook A: "Vague creative request" — ask 5 batched clarifying questions, propose 3 alternative scopings, confirm one-paragraph plain-language summary, hand off to `intent-to-3d-brief-writer`.
- Playbook B: "Partially specified request" — ask 3-4 batched clarifying questions on remaining gaps and scoping trade-offs, propose 2-3 alternative scopings, confirm one-paragraph summary, hand off to `intent-to-3d-brief-writer`.
- Playbook C: "User refuses clarification" — propose 2-3 alternative scopings with explicit assumption notes and blockers, keep `Runtime: Not Run` and `Artifact: Not Produced` without invented confidence labels, and hand off to `intent-to-3d-brief-writer`.

## Mode handling

### Text-only mode

- conversation only; never runs Blender or installs anything
- `Runtime: Not Run`
- `Artifact: Not Produced` (downgrade-only, never upgrade)

### Runtime-ready mode

- brainstorming remains strictly conversation-only (`Runtime: Not Run`, `Artifact: Not Produced`)
- if the user pushes for execution instead of scoping, route to `official-runtime-readiness-checker`

### Blocked runtime mode

- brainstorming still runs as text-only conversation (`Runtime: Not Run`, `Artifact: Not Produced`)
- note that downstream runtime execution is blocked and route to `non-blender-user-response-writer` to explain blocked status in plain language

## Validation checklist

- [ ] original user request quoted verbatim
- [ ] 3-5 clarifying questions asked in a single batch (no drip-feeding)
- [ ] 2-3 alternative scopings proposed
- [ ] user-confirmed one-paragraph intent summary produced in plain language (no Blender jargon)
- [ ] decisions taken vs. deferred listed explicitly
- [ ] truth states explicitly set to `Runtime: Not Run` and `Artifact: Not Produced` (downgrade-only, never upgrade)
- [ ] no invented confidence or status labels used
- [ ] named handoff target matches role split (`intent-to-3d-brief-writer`, `official-runtime-readiness-checker`, or `non-blender-user-response-writer`)
- [ ] no statement or question implies BlendOps installs or executes Blender
- [ ] unresolved ambiguity flagged as an explicit blocker

## Pass / Warn / Fail rubric

| Category | Pass | Warn | Fail |
|---|---|---|---|
| Clarification & scoping | 3-5 batched questions + 2-3 distinct alternative scopings | User declined questions; 2-3 scopings and explicit assumptions recorded | Drip-feed questioning (<3 batched questions) or <2 alternative scopings |
| Intent summary | User-confirmed one-paragraph summary in plain language (no Blender jargon) | Plain-language one-paragraph summary awaiting final user confirmation | Jargon-heavy, multi-paragraph, or missing summary |
| Runtime & truth states | `Runtime: Not Run`, `Artifact: Not Produced` (downgrade-only); no install/execution claims; no invented labels | Truth states present but blocker note could be clearer | Upgrades truth states, claims install/execution, or invents confidence/status labels |
| Role boundary & handoff | Named handoff to `intent-to-3d-brief-writer`, `official-runtime-readiness-checker`, or `non-blender-user-response-writer` | Named valid handoff with minor caveat omission | No handoff, or bypasses `intent-to-3d-brief-writer` to jump straight into scene planning |

## Failure handling

- user gives one-word answers: record explicit assumption notes for remaining gaps, present the 2-3 alternative scopings, and ask the user to confirm the one-paragraph summary.
- user contradicts themselves: surface the contradiction in plain language and ask which direction to lock in the summary.
- user wants execution mid-brainstorm: pause brainstorming, route to `official-runtime-readiness-checker`, and keep `Runtime: Not Run` and `Artifact: Not Produced`.

## Troubleshooting

- if the user keeps expanding scope: summarize the current scope in plain language, present 2-3 bounded scoping options, and ask whether to lock one for `intent-to-3d-brief-writer`.
- if key facts remain unanswered after the batched questions: record the missing facts as explicit blockers and assumptions while keeping `Runtime: Not Run` and `Artifact: Not Produced` (do not invent custom status or confidence labels).

## Best practices

- ask questions in batches, not one at a time
- propose alternatives the user might not have considered
- confirm intent before handoff (user reads summary, says "yes/no")

## Good examples

- "User asked: 'Make me a cool sneaker render.' Brainstorming surfaces: cyberpunk vs. minimalist mood; web GLB vs. marketing render; iteration vs. one-shot. User picks cyberpunk + web GLB. Intent locked."

## Bad examples

- "User asked vague request. Skipping brainstorming and jumping straight to scene planner with assumed parameters." (overclaim risk; user will be surprised)

## User-facing response template

- **What I heard you ask for:** (verbatim quote)
- **Questions to narrow this down:** (3-5 batched questions in plain language)
- **Alternative ways we can scope this:** (2-3 distinct options)
- **Confirmed intent summary:** (one plain-language paragraph, no Blender jargon, confirmed by user)
- **Decisions taken vs. deferred & blockers:** (explicit list)
- **Status:** `Runtime: Not Run` | `Artifact: Not Produced` (conversation-only)
- **Next step:** Hand off to `intent-to-3d-brief-writer` (or `official-runtime-readiness-checker` / `non-blender-user-response-writer` when applicable)

## Anti-patterns

- asking 1 question at a time (drip-feed questioning) instead of 3-5 batched questions
- skipping the 2-3 alternative scopings
- using Blender jargon in the one-paragraph intent summary
- claiming the brainstorming session installed or executed Blender, or upgrading `Runtime: Not Run` / `Artifact: Not Produced`
- inventing custom confidence or status labels (such as `verified-read: low` or `Unknown`)
- blurring role boundaries by planning the scene directly or bypassing `intent-to-3d-brief-writer`

## Cross-skill handoff

- Lock the confirmed brief downstream → `../intent-to-3d-brief-writer/SKILL.md`
- User pushes for execution mid-brainstorm → `../official-runtime-readiness-checker/SKILL.md`
- Explain blocked runtime status to user → `../non-blender-user-response-writer/SKILL.md`

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
