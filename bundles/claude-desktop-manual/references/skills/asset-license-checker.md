# asset-license-checker

Purpose: verify license compliance for downloaded 3D assets, textures, HDRIs, fonts before scene build / mutation / render / export.

Use after asset-discovery produces asset list, before any commercial distribution.

Do not give legal advice; this skill flags risk only. Escalate ambiguity to legal team.

Return per-asset row table (source / license / permissions / verdict / attribution), required attribution lines, assets to remove if Fail, top-line status, "not legal advice" caveat.

Hand off to scene build only when all rows Pass / accepted Warn.
