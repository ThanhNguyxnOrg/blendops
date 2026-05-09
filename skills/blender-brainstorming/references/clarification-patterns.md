# Clarification Patterns

Five-fact framework for batched clarifying questions. Ask all missing facts in **one batch**, never drip-feed.

## The 5 minimum facts a downstream planner needs

| # | Fact | Example question |
|---|---|---|
| 1 | **Subject** | "What's the hero subject — a product, a character, an environment, an abstract scene?" |
| 2 | **Mood / style** | "What mood do you want — minimalist studio, cyberpunk neon, sunset warmth, brutalist concrete, something else?" |
| 3 | **Deliverable type** | "Do you need a render image, a GLB for web, both, or just a planning iteration?" |
| 4 | **Audience** | "Who's the final audience — a marketing team, a non-technical client, a tech artist, mixed?" |
| 5 | **Evidence expectations** | "Are you OK with a text-only plan first (`Not Run`), or do you need actual rendered output (`Verified`) by a deadline?" |

## Question batching rules

- **One batch per turn.** All missing-fact questions in a single message.
- **Plain language.** No jargon (no "topology", "BSDF", "subsurf").
- **Concrete examples in each question.** Helps the user choose without explaining vocabulary.
- **Optional facts** (brand color, performance budget, references) go in a SECOND batch only if the first batch reveals they matter.

## When to skip clarification

- 4-5 of 5 facts are already in the user's request → skip brainstorming, route directly to `intent-to-3d-brief-writer`.
- User explicitly says "just go" → record explicit assumptions, low-confidence handoff.

## When to push back

- User answers everything with "I don't know, you decide" → propose 2-3 default scopings (see `alternative-scoping-templates.md`) and ask the user to pick one. **Do not invent answers silently.**
