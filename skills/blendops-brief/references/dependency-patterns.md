# Dependency patterns

## Pattern A: Asset-first

Recipe 1 prepares shared assets → Recipes 2..N consume them.

Common when:
- Multiple recipes use the same hero model.
- Brand library / pack is needed first.

## Pattern B: Hero-first

Recipe 1 produces the hero scene → Recipe 2 (variants), Recipe 3 (animation), Recipe 4 (different camera angles) consume the hero scene.

Common when:
- One scene drives many outputs.

## Pattern C: Parallel-OK

Recipes 1..N are independent.

Common when:
- Multi-scene catalog (portrait + environment + product all separate).
- No shared assets or scene state.

## Pattern D: Composite-last

Recipes 1..N produce inputs → Recipe N+1 composites them.

Common when:
- Multi-product grid composite of N individual product renders.
- Multi-shot story compositing.

## Recording dependency

Per recipe, record:
- `Depends on: <list of recipe names>` (or "none")
- `Provides: <list of shared assets / scenes>` (or "none")

## Order strategies

- **Topological**: run dependencies before dependents. Always safe.
- **Parallel where independent**: faster total time but more bookkeeping.
- **Hero-first then variants**: simplest mental model.

## Failure modes

- Circular dependency → impossible; reject.
- Recipes share runtime state without explicit dependency → break.
- Composite recipe started before inputs exist → fails gates.

## Related skill
`../SKILL.md`
