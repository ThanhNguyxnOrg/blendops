# Intent Summary Style Guide

After the user picks a scoping, write a **one-paragraph confirmed intent summary** that the user echoes back to confirm.

## Required style

- **Plain language.** No Blender jargon.
- **One paragraph, ≤5 sentences.**
- **Subject + mood + deliverable + audience + evidence expectations** all named.
- **No vague modifiers** ("cool", "nice", "awesome"). Use the user's own descriptive words instead.
- **End with the next-skill handoff statement.**

## Template

> You want a [SUBJECT] in [MOOD/STYLE], delivered as [DELIVERABLES], for [AUDIENCE]. Acceptance is [OBSERVABLE CRITERIA]. Evidence expectation is [`Not Run` / `Produced` / `Verified`]. Decisions deferred to planners: [LIST]. Next step: hand off to [NEXT SKILL] for [PURPOSE].

## Filled example

> You want a floating cyberpunk sneaker in a glossy-dark-floor neon-noir mood, delivered as a render image **and** a GLB for web embed, for your marketing team (non-Blender technical). Acceptance is: subject framing is centered with negative space for headline, neon mood is visible, GLB ≤ 10MB. Evidence expectation: `Verified` for the render, `Produced` for GLB pending web import test. Decisions deferred to planners: exact lighting placement (lighting planner), exact camera angle (composition planner), shoe surface material (material planner). Next step: hand off to `intent-to-3d-brief-writer` to lock the 8-slot brief.

## Anti-patterns

- "Make a cool cyberpunk render of a shoe." (vague modifier "cool", no audience, no evidence expectation, no handoff)
- "User wants subsurf-shaded BSDF cyberpunk subject with topology budget." (Blender jargon for non-Blender audience)
- "We'll figure out the rest as we go." (no decisions deferred list, no observable acceptance criteria)
