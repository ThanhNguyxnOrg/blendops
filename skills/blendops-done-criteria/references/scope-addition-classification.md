# Scope addition classification

## Classification table

| Class | Indicator | Recommendation |
|---|---|---|
| Trivial | Within current gate; <5% extra effort | Mention, may absorb |
| Small | 5-15% extra effort; one new gate or tweak | Offer 3 options; lean accept |
| Medium | 15-30% extra; new sub-stage; new asset | Offer 3 options; balanced |
| Large | >30% extra; new modality (animation, multi-render); new render path | Recommend defer |
| Brief-contradicting | Conflicts with original brief | Pause; revise brief first |

## Effort estimates

Time is the cleanest signal. Estimate:
- Original recipe time
- Addition's marginal time
- New total

If new total > 1.5× original → Medium or Large.
If addition adds new render queue items → at least Medium.
If addition needs new asset sourcing → at least Medium.

## Examples per class

### Trivial
- Slight color tweak in existing material
- Adjusted camera distance by 10cm
- Renamed output file

### Small
- Add one extra prop in scene
- Render one extra frame
- Slightly stricter samples count

### Medium
- Add second camera angle of same scene
- Add one variant of a material
- Add HDRI swap render

### Large
- Add 4 product variants
- Add animation
- Add interior environment to product hero scene
- Add 4K version

### Brief-contradicting
- "Make it look more like X" where X is incompatible with the existing mood/style locked in brief

## Why classify

The class drives recommendation. Without classification, every addition risks being silently absorbed.

## Related skill
`../SKILL.md`
