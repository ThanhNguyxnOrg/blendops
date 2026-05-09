# resolution-aspect-decision

Purpose: pick the right render resolution + aspect ratio for the consumer use case before render; avoid render-then-crop and aspect mismatch.

Use before render when consumer requires specific aspect / resolution, before composition planning.

Do not use after render is complete or for internal preview-only renders.

Output contract: 3-line resolution record (aspect, resolution W × H, DPI/PPI if print), per-output stream resolution if multiple outputs, downscale margin rule, caveats.
