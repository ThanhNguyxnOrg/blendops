# color-management-decision

Purpose: pick the right color management config (sRGB / Filmic / Standard / AgX / ACEScg) per output context before render so colors travel correctly.

Use before render / lookdev pass when consumer color pipeline is known.

Do not use for post-render color grading or raw modeling.

Return 4-line config record (Display Device, View Transform, Look, Sequencer), per-output transform if multiple outputs, caveats.

Hand off to render-export-evidence; pair with output-format-decision and resolution-aspect-decision.
