# Attribution rendering patterns

When an asset's license requires attribution, the attribution must actually appear in the deliverable. Plan where it appears.

## Where to place attribution

| Deliverable | Attribution location |
|---|---|
| Web hero card | Footer or "credits" section linked from page |
| GLB shipped to consumer | License file alongside GLB; consumer renders if commercial |
| Marketing video | Closing credits |
| Social post | Caption or alt-text |
| App / game | About / credits screen |
| Blog post / article | Footer or per-image caption |
| Internal-only deliverable | Internal documentation |

## Attribution format per license

### CC-BY 4.0
"Title" (link) by Author (link) is licensed under CC-BY 4.0.

### CC-BY-SA 4.0
Same as CC-BY plus a note that derivatives must use the same license.

### MIT (for code-licensed assets like fonts with MIT)
Include the full MIT license text.

### Custom / Proprietary
Follow the licensor's required format exactly.

## Common mistakes

- Attribution exists but is not visible to end users (in source comments only, not rendered).
- Attribution lists "various sources" without naming them.
- Attribution placed only in download metadata, not in the running app.
- Forgetting to update attributions when assets change.

## Verifying attribution

Before claiming Pass:
- Where will the attribution appear in the final deliverable?
- Is that location accessible to end users?
- Does it match the license's required format?

If any answer is "unclear", verdict stays Warn.

## Related skill
`../SKILL.md`
