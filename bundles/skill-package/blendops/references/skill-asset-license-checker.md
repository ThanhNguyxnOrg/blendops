# asset-license-checker

Purpose: verify license compliance for downloaded 3D assets, textures, HDRIs, fonts before scene build or export.

Use after asset-discovery produces asset list, before any scene build / mutation / render / export.

Do not use to give legal advice; this skill flags risk only. Escalate ambiguity to legal team.

Output contract: per-asset row table (source / license / permissions / verdict / attribution), required attribution lines, assets to remove if Fail, top-line status, "not legal advice" caveat.
