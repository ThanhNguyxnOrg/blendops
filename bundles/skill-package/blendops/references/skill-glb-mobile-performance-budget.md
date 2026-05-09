# glb-mobile-performance-budget

Purpose: set explicit triangle / texture / draw-call / file-size / animation budgets for GLB targeted at mobile-web before any export decision.

Use whenever the user mentions "mobile", "phone", "low-end", "for the web", or before scene plan locks.

Do not use to claim measured compliance — the budget is a planning ceiling, not a benchmark.

Output contract: numeric budget table per chosen tier (low-end Android / mid-mobile / high-mobile / desktop fallback), violation rule list, degradation order, compliance label `Not Run` until measurement.
