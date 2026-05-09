# resolution-aspect-decision

Purpose: pick the right render resolution + aspect ratio for the consumer use case before render; avoid render-then-crop and aspect mismatch.

Use before render when consumer requires specific aspect / resolution.

Do not use after render is complete.

Return 3-line resolution record (aspect, resolution W × H, DPI/PPI if print), per-output stream resolution if multi-resolution, downscale margin rule, caveats.

Hand off to render-export-evidence.
