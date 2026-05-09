# cycles-vs-eevee-decision

Purpose: pick Cycles or Eevee Next (or Eevee legacy / Workbench) for a render based on quality bar, time budget, and feature requirements (caustics / SSS / volumetrics / GI).

Use before render when feature support drives engine choice or time-vs-quality tradeoff matters.

Do not use for known repeat renders or non-render work.

Output contract: 5-line config record (Engine, Samples, GPU device, Tile/Render samples, Caveats), per-output engine if multi-pass.
