# Budget Reconciliation Patterns

After per-asset strategy is chosen, sum estimated poly / GLB-size / render-time and compare to the brief constraint slot. Surface conflicts before scene planner commits.

## Poly budget summing (web GLB target)

| Asset class | Typical poly cost (procedural) | Typical poly cost (library import) | Typical poly cost (generative) |
|---|---|---|---|
| Hero subject | 2K-8K | 5K-50K | 5K-30K (model-dependent) |
| Floor / large props | 100-500 (procedural plane + Geometry Nodes) | 1K-10K | N/A |
| Small props (5-10 items) | 200-2K total (instanced) | 5K-50K total | N/A |
| Lighting fixtures | 50-200 (mesh light shape) | 500-5K | N/A |
| HDRI environment | 0 (image only) | 0 (image only) | N/A |

## GLB-size summing rules of thumb

| Component | Size impact |
|---|---|
| Hero geometry | Dominant; Draco compression reduces ~5x |
| Textures | High impact; KTX2 compression critical for web |
| HDRI | Large; usually NOT included in GLB (hosted separately or replaced with cubemap) |
| Animation | Per-keyframe-per-bone cost; usually small for static heroes |

## Reconciliation table format

In the per-asset plan, include a budget summary table:

```md
## Budget summary

| Constraint | Target | Estimate | Verdict |
|---|---|---|---|
| Poly budget (mobile web) | ≤ 8K tris hero + 2K env | 6K + 1.5K | Pass |
| GLB size (compressed) | ≤ 10MB | ~6MB | Pass |
| Texture memory | ≤ 32MB | 24MB | Pass |
| Render time (preview) | ≤ 60s on M3 Pro | Estimate 45s | Pass |
```

## When the verdict is `Fail`

If estimated cost exceeds the constraint:

1. Surface the conflict explicitly. Don't quietly relax the constraint.
2. Propose 2-3 trade-off options:
   - Reduce poly via procedural-LOD strategy.
   - Drop a non-essential prop class.
   - Relax the constraint after explicit user confirmation.
3. Route back to `intent-to-3d-brief-writer` slot 4 if the constraint is the bottleneck.

## Anti-patterns

- Summing without comparing against the constraint. The whole point is reconciliation.
- Estimating in vague terms ("should be fine"). Use numbers.
- Silently dropping a prop class because it doesn't fit. Surface it; let the user decide.
