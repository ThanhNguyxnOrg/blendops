# asset-style-consistency-checker

Purpose: verify chosen assets share visual style (realism, detail, color, surface) before scene build; flag drift between assets early.

Use after asset-license-checker clears, before scene build, when scene preview shows visible style mismatch.

Do not use for single asset (no consistency check needed) or pure planning before assets are picked.

Output contract: per-asset row (4-axis position + drift verdict), top-line consistency, assets to drop / restyle / replace.
