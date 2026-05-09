# EVAL — pack-prerequisite-checker

## Text-only eval prompt

User picked `product-hero-v0`, brief has mood + product silhouette but no asset strategy, no runtime path stated, wants GLB for web.

## Expected behavior

- Flag asset strategy + web handoff skills as needed inputs
- Runtime row = Needs input until path chosen
- Warn if GLB web targets unstated (mobile tier)
- Hand off to `blender-asset-discovery-planner` or `runtime-path-picker`

## Pass / Warn / Fail criteria

- Pass: matrix + go/no-go + owner actions
- Warn: accepted gaps documented
- Fail: declares go with missing critical brief fields

## Sample passing response outline

- Table + no-go with three owner actions

## Sample failing response outline

- "Ready to model" with no asset plan
