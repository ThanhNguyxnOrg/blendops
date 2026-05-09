# color-management-decision

Purpose: pick the right color management config (sRGB / Filmic / Standard / AgX / ACEScg) per output context before render so colors travel correctly to the consumer.

Use before render / lookdev pass when consumer color pipeline is known, or when a previous render had unexpected color shifts.

Do not use for post-render color grading or raw modeling.

Output contract: 4-line config record (Display Device, View Transform, Look, Sequencer), per-output transform if multiple outputs, caveats per choice.
