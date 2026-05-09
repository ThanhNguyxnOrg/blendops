# blender-asset-discovery-planner

Purpose: per-asset acquisition strategy (procedural / library / generative / photogrammetry) before scene planning. BlendOps-specific (no direct Superpowers / BMad analog).

Use after the 8-slot brief is locked, when scene assets aren't trivially given, or when poly budget / GLB size / brand-licensing constraints exist. Skip if user supplied all assets in the brief.

Output contract: per-asset-class plan with strategy + source candidate + license + confidence + risk. Poly / GLB-size budget summed and compared to brief constraints. Generative strategy flagged with Path 2 caveat. This skill does not fetch / install / generate anything. Hand off to scene planner.
