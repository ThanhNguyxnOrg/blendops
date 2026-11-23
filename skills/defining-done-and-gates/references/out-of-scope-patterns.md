# Out-of-scope patterns

The "out of scope" list is at least as important as the stop condition. It prevents:
- silent scope creep
- "while we're at it" drift
- post-stop polish that compounds time

## Common out-of-scope items per recipe type

### Render hero
- Alternate lighting takes
- Animation
- Post-process color grade beyond default
- Multiple aspect ratios from same scene
- Variant material colors

### GLB export
- Multiple LOD levels (unless explicit)
- Animation re-targeting
- Web component implementation
- Asset re-licensing

### Scene plan (text-only)
- Modeling work
- Asset sourcing (only flagging)
- Render preview
- Final-quality rendering

### Multi-product grid
- Per-product hero variants
- Lifestyle context shots
- Animation
- Per-product separate renders (unless requested)

## When to add to out-of-scope

If during work the user says "could you also...", that addition goes to:
- (a) a new follow-up recipe with its own stop condition, OR
- (b) the current recipe's out-of-scope (if the user is just exploring, not requesting).

Never silently expand the in-scope work to absorb the addition.

## How to phrase

- "Animation" (not "we won't animate" — phrase as a topic, not a verb negation)
- "Lifestyle context shots" (specific, not "anything else")
- Pair with "deferred to follow-up recipe" if the user wants to do it later.

## Related skill
`../SKILL.md`
