# product-grid-scene-planner

Purpose: plan a multi-product grid scene (e-commerce / catalog / comparison) with consistent lighting, camera, background, and grid spacing.

Use when intent is multi-product display (4+ products in same scene).

Do not use for single product hero (use product-hero-scene-planner). Do not mix products at very different scales without normalization.

Return structured plan with Product list / Grid layout / Consistency level / Shared lighting / Shared background / Per-cell camera / Caption space sections, asset list flagged, evidence label.

Hand off to blender-asset-discovery-planner / composition-quality-checker / lighting-quality-checker / material-quality-checker.
