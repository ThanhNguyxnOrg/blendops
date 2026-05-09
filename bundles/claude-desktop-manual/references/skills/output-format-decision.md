# output-format-decision

Purpose: pick the right output file format (PNG / JPG / WebP / OpenEXR / TIFF) per use case based on bit depth, compression, transparency, consumer support.

Use before render when consumer requires specific format or HDR / transparency / loss tolerance matters.

Do not use for raw modeling or 3D exports.

Return 4-line format record per output stream (format, bit depth, compression, alpha), per-output rules, caveats.

Hand off to render-export-evidence; pair with color-management-decision and resolution-aspect-decision.
