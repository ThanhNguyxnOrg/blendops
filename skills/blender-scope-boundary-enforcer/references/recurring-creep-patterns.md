# Recurring creep patterns

When the same user repeatedly drives scope creep, the pattern itself is the issue. Catch it.

## Common patterns

### Pattern A: "Just one more thing"
- 3+ small additions in one recipe.
- Each individually trivial; together they double scope.
- Response: pause and propose a follow-up recipe to bundle the additions.

### Pattern B: Late-stage feature requests
- User adds substantive features after the render gate has run.
- Response: hold the line; defer to follow-up. Re-running gates with new scope is expensive.

### Pattern C: Scope grows under deadline pressure
- "We're already running this, can we squeeze in X?"
- Response: explicit cost language; let the user weigh deadline vs scope.

### Pattern D: Brief revision masquerading as addition
- "Actually let's also flip the brand to Y" mid-recipe.
- This is a brief revision, not a scope addition. Pause; revise brief; restart relevant stages.

### Pattern E: Polish creep
- "Looks great, but can we tweak X for the tenth time?"
- Stop condition has been met. Revisit with `blender-stop-condition-decider`.

## Why catch the pattern

A single addition is trivial. A repeated pattern compounds:
- Gates lose meaning.
- Stop condition drifts.
- Time multiplies.
- Recipe quality degrades.

## Response per pattern

| Pattern | Suggested response |
|---|---|
| A — "just one more" | Pause; propose follow-up recipe to bundle |
| B — late-stage requests | Hold gate; defer |
| C — deadline pressure | Cost-explicit options |
| D — brief revision | Reset brief; restart relevant stages |
| E — polish creep | Reaffirm stop condition |

## When to escalate

If patterns A-E repeat across multiple recipes, propose a process retro:
- Are briefs scoped tightly enough?
- Are stop conditions concrete enough?
- Is the recipe size right?
- Is the user actually exploring rather than committing?

## Related skill
`../SKILL.md`
