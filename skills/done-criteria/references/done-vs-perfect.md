# Done vs perfect

## Why this matters

"Done" is honest completion against a stop condition. "Perfect" is an asymptote — pursuing it eats time without bounded benefit.

The stop condition pins "done" so the agent stops before drifting toward "perfect".

## When users push past the stop condition

User says: "Looks great, but can we also...?"

Response:
1. Acknowledge the stop condition is met.
2. Offer the addition as a new scope agreement (new recipe / new stop condition).
3. Do not silently absorb.

User says: "Almost there, just one more pass at...?"

Response:
1. Check: does the stop condition actually require another pass?
2. If yes (the condition not yet evaluated true) → continue.
3. If no (condition is met but user wants more polish) → flag as scope addition; require new agreement.

## Polish vs done — the test

Question to self: **Has the stop condition been verified by evidence?**
- Yes → done. Stop. Hand off.
- No → not done. Continue per checklist gates.

This separates "honest done" from "feels not done".

## When not done feels done

Sometimes a render "feels great" but the stop condition is technically not met (e.g. samples threshold not yet reached, or validation not logged). In this case:
- "Done" remains `Pending` until evidence supports it.
- The user can choose to amend the stop condition (with a new agreement) if the original bar was too strict.
- Do not silently mark done.

## When done feels not done

Sometimes the stop condition is met but the result feels disappointing. In this case:
- The recipe is honestly done per agreed bar.
- Disappointment indicates the stop condition was the wrong target.
- Document as a learning for the next recipe; do not extend this one silently.

## Related skill
`../SKILL.md`
