# Web Layout Negative Space & Viewport Safe Zones

## Purpose
Guarantee hero renders and interactive GLB camera rigs leave clean unobstructed viewport area for web headings, pricing blocks, CTA buttons, and mobile reflows.

## When to use
Whenever outputs target hero sections, landing pages, split-screen showcases, or embedded React Three Fiber viewports.

## Quantitative Safe-Zone Checklist

| Check | Target Rule | Failure Risk |
|---|---|---|
| **Copy-safe negative space** | Reserve `35% – 45%` clean horizontal strip (left or right third) or upper band for UI copy; keep gradient backdrop calm behind text. | Headline sits across busy specular geometry and fails WCAG text contrast. |
| **Focal off-center target offset** | Aim `lookAt` / OrbitControls target toward `X = ±0.20..0.30` normalized viewport offset rather than translating the mesh away from world `(0,0,0)`. | Offsetting geometry breaks turntable pivot centers later in Three.js / R3F. |
| **Desktop (`16:9` / `1440×900`) vs Mobile (`9:16` / `390×844`)** | Confirm silhouette stays intact inside center-weighted crop or document explicit camera FOV / distance adaptation for portrait viewports. | Product toe/handle clips off horizontal screen edges on mobile screens. |
| **Shadow & reflection tail clearance** | Keep `≥ 10%` padding below contact shadow and rim fade-out inside the canvas frame. | Hard rectangular shadow crop at bottom canvas edge looks broken on page background. |

## Good example
"Target offset shifts sneaker cleanly to right 60% on desktop (`16:9`), preserving left 40% matte charcoal negative space (`#0F1117`) for H1 + CTA with zero silhouette overlap; mobile (`390×844`) resets target to centered `3/4` orbit."

## Bad example
"Centered shoe filling 92% width — landing page headline overlaps the laces and bright rim highlight."

## Related skill
- [SKILL.md](../SKILL.md)
